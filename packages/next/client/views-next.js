import { hydrate, version } from './views-index'

window.next = {
  version,
  root: true,
}

// Override chunk URL mapping in the webpack runtime
// https://github.com/webpack/webpack/blob/2738eebc7880835d88c727d364ad37f3ec557593/lib/RuntimeGlobals.js#L204
// @ts-ignore
const getChunkScriptFilename = __webpack_require__.u
__webpack_require__.u = (chunkId) => {
  return getChunkScriptFilename(chunkId) || `static/chunks/${chunkId}.js`
}

hydrate()
