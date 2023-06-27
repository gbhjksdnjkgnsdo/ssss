import { computeChangedPath } from './compute-changed-path'
import {
  Mutable,
  ReadonlyReducerState,
  ReducerState,
} from './router-reducer-types'

export function handleMutable(
  state: ReadonlyReducerState,
  mutable: Mutable
): ReducerState {
  return {
    buildId: state.buildId,
    // Set href.
    canonicalUrl:
      typeof mutable.canonicalUrl !== 'undefined'
        ? mutable.canonicalUrl === state.canonicalUrl
          ? state.canonicalUrl
          : mutable.canonicalUrl
        : state.canonicalUrl,
    pushRef: {
      pendingPush:
        typeof mutable.pendingPush !== 'undefined'
          ? mutable.pendingPush
          : state.pushRef.pendingPush,
      mpaNavigation:
        typeof mutable.mpaNavigation !== 'undefined'
          ? mutable.mpaNavigation
          : state.pushRef.mpaNavigation,
    },
    // All navigation requires scroll and focus management to trigger.
    focusAndScrollRef: {
      apply: mutable.shouldScroll
        ? mutable?.scrollableSegments !== undefined
          ? true
          : state.focusAndScrollRef.apply
        : // If shouldScroll is false then we should not apply scroll and focus management.
          false,
      hashFragment: mutable.shouldScroll
        ? // Empty hash should trigger default behavior of scrolling layout into view.
          // #top is handled in layout-router.
          mutable.hashFragment && mutable.hashFragment !== ''
          ? // Remove leading # and decode hash to make non-latin hashes work.
            decodeURIComponent(mutable.hashFragment.slice(1))
          : state.focusAndScrollRef.hashFragment
        : // If shouldScroll is false then we should not apply scroll and focus management.
          null,
      segmentPaths: mutable.shouldScroll
        ? mutable?.scrollableSegments ?? state.focusAndScrollRef.segmentPaths
        : // If shouldScroll is false then we should not apply scroll and focus management.
          [],
    },
    // Apply cache.
    cache: mutable.cache ? mutable.cache : state.cache,
    prefetchCache: mutable.prefetchCache
      ? mutable.prefetchCache
      : state.prefetchCache,
    // Apply patched router state.
    tree:
      typeof mutable.patchedTree !== 'undefined'
        ? mutable.patchedTree
        : state.tree,
    nextUrl:
      typeof mutable.patchedTree !== 'undefined'
        ? computeChangedPath(state.tree, mutable.patchedTree) ??
          state.canonicalUrl
        : state.nextUrl,
  }
}
