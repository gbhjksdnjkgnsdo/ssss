use serde::Deserialize;
use turbo_rcstr::RcStr;

/// The top-most structure encoded into the query param in requests to
/// `next/font/google` generated by the next/font swc transform. e.g.
/// `next/font/google/target.css?{"path": "index.js", "import": "Inter"...`
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct NextFontRequest {
    pub import: RcStr,
    pub arguments: Vec<NextFontRequestArguments>,
}

#[derive(Clone, Debug, Default, Deserialize)]
pub(super) struct NextFontRequestArguments {
    pub weight: Option<OneOrManyStrings>,
    pub subsets: Option<Vec<RcStr>>,
    pub style: Option<OneOrManyStrings>,
    pub display: Option<RcStr>,
    pub preload: Option<bool>,
    pub axes: Option<Vec<RcStr>>,
    pub fallback: Option<Vec<RcStr>>,
    pub adjust_font_fallback: Option<bool>,
    pub variable: Option<RcStr>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(untagged)]
pub(super) enum OneOrManyStrings {
    One(RcStr),
    Many(Vec<RcStr>),
}
