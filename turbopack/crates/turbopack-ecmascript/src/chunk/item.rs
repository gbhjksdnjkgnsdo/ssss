use std::io::Write;

use anyhow::{bail, Result};
use serde::{Deserialize, Serialize};
use turbo_tasks::{trace::TraceRawVcs, Upcast, ValueToString, Vc};
use turbo_tasks_fs::rope::Rope;
use turbopack_core::{
    chunk::{AsyncModuleInfo, ChunkItem, ChunkItemExt, ChunkingContext},
    code_builder::{Code, CodeBuilder},
    error::PrettyPrintError,
    issue::{code_gen::CodeGenerationIssue, IssueExt, IssueSeverity, StyledString},
    source_map::GenerateSourceMap,
};

use crate::{
    references::{
        async_module::{AsyncModuleOptions, OptionAsyncModuleOptions},
        DeclaredCjsGlobals,
    },
    utils::FormatIter,
    EcmascriptModuleContent, EcmascriptOptions,
};

#[turbo_tasks::value(shared)]
#[derive(Default, Clone)]
pub struct EcmascriptChunkItemContent {
    pub inner_code: Rope,
    pub source_map: Option<Vc<Box<dyn GenerateSourceMap>>>,
    pub options: EcmascriptChunkItemOptions,
    pub placeholder_for_future_extensions: (),
}

#[turbo_tasks::value_impl]
impl EcmascriptChunkItemContent {
    #[turbo_tasks::function]
    pub async fn new(
        content: Vc<EcmascriptModuleContent>,
        chunking_context: Vc<Box<dyn ChunkingContext>>,
        options: Vc<EcmascriptOptions>,
        async_module_options: Vc<OptionAsyncModuleOptions>,
        declared_cjs_globals: Vc<DeclaredCjsGlobals>,
    ) -> Result<Vc<Self>> {
        let refresh = options.await?.refresh;
        let externals = *chunking_context
            .environment()
            .supports_commonjs_externals()
            .await?;

        let content = content.await?;
        let async_module = async_module_options.await?.clone_value();
        let declared_cjs_globals = declared_cjs_globals.await?;

        Ok(EcmascriptChunkItemContent {
            inner_code: content.inner_code.clone(),
            source_map: content.source_map,
            options: if content.is_esm {
                EcmascriptChunkItemOptions {
                    strict: true,
                    refresh,
                    externals,
                    async_module,
                    require: if declared_cjs_globals.require {
                        EcmascriptChunkItemRequireType::None
                    } else {
                        EcmascriptChunkItemRequireType::Stub
                    },
                    ..Default::default()
                }
            } else {
                if async_module.is_some() {
                    bail!("CJS module can't be async.");
                }

                EcmascriptChunkItemOptions {
                    refresh,
                    externals,
                    require: EcmascriptChunkItemRequireType::Real,
                    // These are not available in ESM
                    module: true,
                    exports: true,
                    this: true,
                    dirname: true,
                    ..Default::default()
                }
            },
            ..Default::default()
        }
        .cell())
    }

    #[turbo_tasks::function]
    pub async fn module_factory(&self) -> Result<Vc<Code>> {
        let this = self;
        let mut args = vec![
            "r: __turbopack_require__",
            "f: __turbopack_module_context__",
            "i: __turbopack_import__",
            "s: __turbopack_esm__",
            "v: __turbopack_export_value__",
            "n: __turbopack_export_namespace__",
            "c: __turbopack_cache__",
            "M: __turbopack_modules__",
            "l: __turbopack_load__",
            "j: __turbopack_dynamic__",
            "P: __turbopack_resolve_absolute_path__",
            "U: __turbopack_relative_url__",
            "R: __turbopack_resolve_module_id_path__",
            "b: __turbopack_worker_blob_url__",
            "g: global",
        ];
        if this.options.async_module.is_some() {
            args.push("a: __turbopack_async_module__");
        }
        if this.options.externals {
            args.push("x: __turbopack_external_require__");
            args.push("y: __turbopack_external_import__");
        }
        if this.options.refresh {
            args.push("k: __turbopack_refresh__");
        }
        if this.options.dirname {
            args.push("__dirname");
        }
        if this.options.module || this.options.refresh {
            args.push("m: module");
        }
        if this.options.exports {
            args.push("e: exports");
        }
        match this.options.require {
            EcmascriptChunkItemRequireType::Real => args.push("t: require"),
            EcmascriptChunkItemRequireType::Stub => args.push("z: require"),
            EcmascriptChunkItemRequireType::None => {}
        }

        if this.options.wasm {
            args.push("w: __turbopack_wasm__");
            args.push("u: __turbopack_wasm_module__");
        }

        let mut code = CodeBuilder::default();
        let args = FormatIter(|| args.iter().copied().intersperse(", "));
        if this.options.this {
            code += "(function(__turbopack_context__) {\n";
        } else {
            code += "((__turbopack_context__) => {\n";
        }
        if this.options.strict {
            code += "\"use strict\";\n\n";
        } else {
            code += "\n";
        }
        writeln!(code, "var {{ {} }} = __turbopack_context__;", args)?;

        if this.options.async_module.is_some() {
            code += "__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, \
                     __turbopack_async_result__) => { try {\n";
        }

        code.push_source(&this.inner_code, this.source_map);

        if let Some(opts) = &this.options.async_module {
            write!(
                code,
                "__turbopack_async_result__();\n}} catch(e) {{ __turbopack_async_result__(e); }} \
                 }}, {});",
                opts.has_top_level_await
            )?;
        }

        code += "})";
        Ok(code.build().cell())
    }
}

#[derive(PartialEq, Eq, Default, Debug, Clone, Serialize, Deserialize, TraceRawVcs)]
pub enum EcmascriptChunkItemRequireType {
    /// No require at all
    #[default]
    None,
    /// A throwing stub (for ESM)
    Stub,
    /// The real require
    Real,
}

#[derive(PartialEq, Eq, Default, Debug, Clone, Serialize, Deserialize, TraceRawVcs)]
pub struct EcmascriptChunkItemOptions {
    /// Whether this chunk item should be in "use strict" mode.
    pub strict: bool,
    /// Whether this chunk item's module factory should include a
    /// `__turbopack_refresh__` argument.
    pub refresh: bool,
    /// Whether this chunk item's module factory should include a `module`
    /// argument.
    pub module: bool,
    /// Whether this chunk item's module factory should include an `exports`
    /// argument.
    pub exports: bool,
    /// Whether this chunk item's module factory should include an `__dirname`
    /// argument.
    pub dirname: bool,
    /// What `require` argument this chunk item's module factory should include
    /// an argument for the real `require`.
    pub require: EcmascriptChunkItemRequireType,
    /// Whether this chunk item's module factory should include a
    /// `__turbopack_external_require__` argument.
    pub externals: bool,
    /// Whether this chunk item's module is async (either has a top level await
    /// or is importing async modules).
    pub async_module: Option<AsyncModuleOptions>,
    /// Whether this chunk item accesses the module-global `this` object.
    pub this: bool,
    /// Whether this chunk item's module factory should include
    /// `__turbopack_wasm__` to load WebAssembly.
    pub wasm: bool,
    pub placeholder_for_future_extensions: (),
}

#[turbo_tasks::value_trait]
pub trait EcmascriptChunkItem: ChunkItem {
    fn content(self: Vc<Self>) -> Vc<EcmascriptChunkItemContent>;
    fn content_with_async_module_info(
        self: Vc<Self>,
        _async_module_info: Option<Vc<AsyncModuleInfo>>,
    ) -> Vc<EcmascriptChunkItemContent> {
        self.content()
    }
    fn chunking_context(self: Vc<Self>) -> Vc<Box<dyn ChunkingContext>>;

    /// Specifies which availablility information the chunk item needs for code
    /// generation
    fn need_async_module_info(self: Vc<Self>) -> Vc<bool> {
        Vc::cell(false)
    }
}

pub trait EcmascriptChunkItemExt: Send {
    /// Generates the module factory for this chunk item.
    fn code(self: Vc<Self>, async_module_info: Option<Vc<AsyncModuleInfo>>) -> Vc<Code>;
}

impl<T> EcmascriptChunkItemExt for T
where
    T: Upcast<Box<dyn EcmascriptChunkItem>>,
{
    /// Generates the module factory for this chunk item.
    fn code(self: Vc<Self>, async_module_info: Option<Vc<AsyncModuleInfo>>) -> Vc<Code> {
        module_factory_with_code_generation_issue(Vc::upcast(self), async_module_info)
    }
}

#[turbo_tasks::function]
async fn module_factory_with_code_generation_issue(
    chunk_item: Vc<Box<dyn EcmascriptChunkItem>>,
    async_module_info: Option<Vc<AsyncModuleInfo>>,
) -> Result<Vc<Code>> {
    Ok(
        match chunk_item
            .content_with_async_module_info(async_module_info)
            .module_factory()
            .resolve()
            .await
        {
            Ok(factory) => factory,
            Err(error) => {
                let id = chunk_item.id().to_string().await;
                let id = id.as_ref().map_or_else(|_| "unknown", |id| &**id);
                let error = error.context(format!(
                    "An error occurred while generating the chunk item {}",
                    id
                ));
                let error_message = format!("{}", PrettyPrintError(&error)).into();
                let js_error_message = serde_json::to_string(&error_message)?;
                CodeGenerationIssue {
                    severity: IssueSeverity::Error.cell(),
                    path: chunk_item.asset_ident().path(),
                    title: StyledString::Text("Code generation for chunk item errored".into())
                        .cell(),
                    message: StyledString::Text(error_message).cell(),
                }
                .cell()
                .emit();
                let mut code = CodeBuilder::default();
                code += "(() => {{\n\n";
                writeln!(code, "throw new Error({error});", error = &js_error_message)?;
                code += "\n}})";
                code.build().cell()
            }
        },
    )
}

#[turbo_tasks::value(transparent)]
pub struct EcmascriptChunkItemsChunk(Vec<Vc<Box<dyn EcmascriptChunkItem>>>);

#[turbo_tasks::value(transparent)]
pub struct EcmascriptChunkItems(pub(super) Vec<Vc<Box<dyn EcmascriptChunkItem>>>);
