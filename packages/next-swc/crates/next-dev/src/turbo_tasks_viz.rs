use std::{sync::Arc, time::Duration};

use anyhow::{bail, Result};
use mime::TEXT_HTML_UTF_8;
use turbo_tasks::{get_invalidator, TurboTasks, TurboTasksBackendApi, Value};
use turbopack_binding::{
    turbo::{
        tasks_fs::File,
        tasks_memory::{
            stats::{ReferenceType, Stats},
            viz, MemoryBackend,
        },
    },
    turbopack::{
        core::asset::AssetContentVc,
        dev_server::source::{
            route_tree::{BaseSegment, RouteTreeVc, RouteTreesVc, RouteType},
            ContentSource, ContentSourceContentVc, ContentSourceData, ContentSourceDataFilter,
            ContentSourceDataVary, ContentSourceDataVaryVc, ContentSourceVc,
            GetContentSourceContent, GetContentSourceContentVc,
        },
    },
};

#[turbo_tasks::value(serialization = "none", eq = "manual", cell = "new", into = "new")]
pub struct TurboTasksSource {
    #[turbo_tasks(debug_ignore, trace_ignore)]
    pub turbo_tasks: Arc<TurboTasks<MemoryBackend>>,
}

impl TurboTasksSourceVc {
    pub fn new(turbo_tasks: Arc<TurboTasks<MemoryBackend>>) -> Self {
        Self::cell(TurboTasksSource { turbo_tasks })
    }
}

const INVALIDATION_INTERVAL: Duration = Duration::from_secs(3);

const GRAPH_PATH: &str = "graph";
const CALL_GRAPH_PATH: &str = "call-graph";
const TABLE_PATH: &str = "table";
const RESET_PATH: &str = "reset";

#[turbo_tasks::value_impl]
impl ContentSource for TurboTasksSource {
    #[turbo_tasks::function]
    fn get_routes(self_vc: TurboTasksSourceVc) -> RouteTreeVc {
        RouteTreesVc::cell(vec![
            RouteTreeVc::new_route(
                vec![BaseSegment::Static(GRAPH_PATH.to_string())],
                RouteType::Exact,
                self_vc.into(),
            ),
            RouteTreeVc::new_route(
                vec![BaseSegment::Static(CALL_GRAPH_PATH.to_string())],
                RouteType::Exact,
                self_vc.into(),
            ),
            RouteTreeVc::new_route(
                vec![BaseSegment::Static(TABLE_PATH.to_string())],
                RouteType::Exact,
                self_vc.into(),
            ),
            RouteTreeVc::new_route(
                vec![BaseSegment::Static(RESET_PATH.to_string())],
                RouteType::Exact,
                self_vc.into(),
            ),
        ])
        .merge()
    }
}

#[turbo_tasks::value_impl]
impl GetContentSourceContent for TurboTasksSource {
    #[turbo_tasks::function]
    fn vary(&self) -> ContentSourceDataVaryVc {
        ContentSourceDataVary {
            query: Some(ContentSourceDataFilter::All),
            ..Default::default()
        }
        .cell()
    }

    #[turbo_tasks::function]
    async fn get(
        self_vc: TurboTasksSourceVc,
        path: &str,
        data: Value<ContentSourceData>,
    ) -> Result<ContentSourceContentVc> {
        let this = self_vc.await?;
        let tt = &this.turbo_tasks;
        let invalidator = get_invalidator();
        tokio::spawn({
            async move {
                tokio::time::sleep(INVALIDATION_INTERVAL).await;
                invalidator.invalidate();
            }
        });
        let html = match path {
            GRAPH_PATH => {
                let mut stats = Stats::new();
                let b = tt.backend();
                b.with_all_cached_tasks(|task| {
                    stats.add_id(b, task);
                });
                let tree = stats.treeify(ReferenceType::Dependency);
                let graph = viz::graph::visualize_stats_tree(
                    tree,
                    ReferenceType::Dependency,
                    tt.stats_type(),
                );
                viz::graph::wrap_html(&graph)
            }
            CALL_GRAPH_PATH => {
                let mut stats = Stats::new();
                let b = tt.backend();
                b.with_all_cached_tasks(|task| {
                    stats.add_id(b, task);
                });
                let tree = stats.treeify(ReferenceType::Child);
                let graph =
                    viz::graph::visualize_stats_tree(tree, ReferenceType::Child, tt.stats_type());
                viz::graph::wrap_html(&graph)
            }
            TABLE_PATH => {
                let Some(query) = &data.query else {
                    bail!("Missing query");
                };
                let mut stats = Stats::new();
                let b = tt.backend();
                let active_only = query.contains_key("active");
                let include_unloaded = query.contains_key("unloaded");
                b.with_all_cached_tasks(|task| {
                    stats.add_id_conditional(b, task, |_, info| {
                        (include_unloaded || !info.unloaded) && (!active_only || info.active)
                    });
                });
                let tree = stats.treeify(ReferenceType::Dependency);
                let table = viz::table::create_table(tree, tt.stats_type());
                viz::table::wrap_html(&table)
            }
            RESET_PATH => {
                let b = tt.backend();
                b.with_all_cached_tasks(|task| {
                    b.with_task(task, |task| task.reset_stats());
                });
                "Done".to_string()
            }
            _ => bail!("Unknown path: {}", path),
        };
        Ok(ContentSourceContentVc::static_content(
            AssetContentVc::from(File::from(html).with_content_type(TEXT_HTML_UTF_8)).into(),
        ))
    }
}
