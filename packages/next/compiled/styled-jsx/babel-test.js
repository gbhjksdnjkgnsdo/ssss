(()=>{var e={701:(e,r,t)=>{e.exports=t(551)},551:(e,r,t)=>{"use strict";r.__esModule=true;r["default"]=_default;var n=_interopRequireDefault(t(50));function _interopRequireDefault(e){return e&&e.__esModule?e:{default:e}}function _default(){return{inherits:n["default"],visitor:{JSXOpeningElement:function JSXOpeningElement(e){var r=e.node;var t=r.name||{},n=t.name;if(n!=="style"){return}r.attributes=r.attributes.filter((function(e){var r=e.name.name;return r!=="jsx"&&r!=="global"}))}}}}},50:e=>{"use strict";e.exports=require("next/dist/compiled/babel/plugin-syntax-jsx")}};var r={};function __nccwpck_require__(t){var n=r[t];if(n!==undefined){return n.exports}var u=r[t]={exports:{}};var i=true;try{e[t](u,u.exports,__nccwpck_require__);i=false}finally{if(i)delete r[t]}return u.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var t=__nccwpck_require__(701);module.exports=t})();