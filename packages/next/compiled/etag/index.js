(()=>{"use strict";var e={602:(e,t,r)=>{
/*!
 * etag
 * Copyright(c) 2014-2016 Douglas Christopher Wilson
 * MIT Licensed
 */
e.exports=etag;var i=r(113);var n=r(147).Stats;var a=Object.prototype.toString;function entitytag(e){if(e.length===0){return'"0-2jmj7l5rSw0yVb/vlWAYkK/YBwk"'}var t=i.createHash("sha1").update(e,"utf8").digest("base64").substring(0,27);var r=typeof e==="string"?Buffer.byteLength(e,"utf8"):e.length;return'"'+r.toString(16)+"-"+t+'"'}function etag(e,t){if(e==null){throw new TypeError("argument entity is required")}var r=isstats(e);var i=t&&typeof t.weak==="boolean"?t.weak:r;if(!r&&typeof e!=="string"&&!Buffer.isBuffer(e)){throw new TypeError("argument entity must be string, Buffer, or fs.Stats")}var n=r?stattag(e):entitytag(e);return i?"W/"+n:n}function isstats(e){if(typeof n==="function"&&e instanceof n){return true}return e&&typeof e==="object"&&"ctime"in e&&a.call(e.ctime)==="[object Date]"&&"mtime"in e&&a.call(e.mtime)==="[object Date]"&&"ino"in e&&typeof e.ino==="number"&&"size"in e&&typeof e.size==="number"}function stattag(e){var t=e.mtime.getTime().toString(16);var r=e.size.toString(16);return'"'+r+"-"+t+'"'}},113:e=>{e.exports=require("crypto")},147:e=>{e.exports=require("fs")}};var t={};function __nccwpck_require__(r){var i=t[r];if(i!==undefined){return i.exports}var n=t[r]={exports:{}};var a=true;try{e[r](n,n.exports,__nccwpck_require__);a=false}finally{if(a)delete t[r]}return n.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var r=__nccwpck_require__(602);module.exports=r})();