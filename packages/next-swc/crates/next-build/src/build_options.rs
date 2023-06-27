use std::path::PathBuf;

use next_core::{next_config::Rewrites, turbopack::core::issue::IssueSeverity};

#[derive(Clone, Debug)]
pub struct BuildOptions {
    /// The root directory of the workspace.
    pub root: Option<PathBuf>,

    /// The project's directory.
    pub dir: Option<PathBuf>,

    /// The maximum memory to use for the build.
    pub memory_limit: Option<usize>,

    /// The log level to use for the build.
    pub log_level: Option<IssueSeverity>,

    /// Whether to show all logs.
    pub show_all: bool,

    /// Whether to show detailed logs.
    pub log_detail: bool,

    /// Whether to compute full stats.
    pub full_stats: bool,

    /// The Next.js build context.
    pub build_context: Option<BuildContext>,
}

#[derive(Clone, Debug)]
pub struct BuildContext {
    /// The build id.
    pub build_id: String,

    /// Next.js config rewrites.
    pub rewrites: Rewrites,
}
