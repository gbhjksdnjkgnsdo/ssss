import{createRequire as e}from"module";var r={};(()=>{r.d=(e,t)=>{for(var o in t){if(r.o(t,o)&&!r.o(e,o)){Object.defineProperty(e,o,{enumerable:true,get:t[o]})}}}})();(()=>{r.o=(e,r)=>Object.prototype.hasOwnProperty.call(e,r)})();if(typeof r!=="undefined")r.ab=new URL(".",import.meta.url).pathname.slice(import.meta.url.match(/^file:\/\/\/\w:/)?1:0,-1)+"/";var t={};r.d(t,{cX:()=>Chalk,Z8:()=>i,z7:()=>i,Zj:()=>F,Yf:()=>a,O9:()=>a,ZP:()=>j,oL:()=>l,B2:()=>l,kV:()=>s,LY:()=>s,hH:()=>O,Nj:()=>v});const o=10;const wrapAnsi16=(e=0)=>r=>`[${r+e}m`;const wrapAnsi256=(e=0)=>r=>`[${38+e};5;${r}m`;const wrapAnsi16m=(e=0)=>(r,t,o)=>`[${38+e};2;${r};${t};${o}m`;const n={modifier:{reset:[0,0],bold:[1,22],dim:[2,22],italic:[3,23],underline:[4,24],overline:[53,55],inverse:[7,27],hidden:[8,28],strikethrough:[9,29]},color:{black:[30,39],red:[31,39],green:[32,39],yellow:[33,39],blue:[34,39],magenta:[35,39],cyan:[36,39],white:[37,39],blackBright:[90,39],gray:[90,39],grey:[90,39],redBright:[91,39],greenBright:[92,39],yellowBright:[93,39],blueBright:[94,39],magentaBright:[95,39],cyanBright:[96,39],whiteBright:[97,39]},bgColor:{bgBlack:[40,49],bgRed:[41,49],bgGreen:[42,49],bgYellow:[43,49],bgBlue:[44,49],bgMagenta:[45,49],bgCyan:[46,49],bgWhite:[47,49],bgBlackBright:[100,49],bgGray:[100,49],bgGrey:[100,49],bgRedBright:[101,49],bgGreenBright:[102,49],bgYellowBright:[103,49],bgBlueBright:[104,49],bgMagentaBright:[105,49],bgCyanBright:[106,49],bgWhiteBright:[107,49]}};const s=Object.keys(n.modifier);const l=Object.keys(n.color);const i=Object.keys(n.bgColor);const a=[...l,...i];function assembleStyles(){const e=new Map;for(const[r,t]of Object.entries(n)){for(const[r,o]of Object.entries(t)){n[r]={open:`[${o[0]}m`,close:`[${o[1]}m`};t[r]=n[r];e.set(o[0],o[1])}Object.defineProperty(n,r,{value:t,enumerable:false})}Object.defineProperty(n,"codes",{value:e,enumerable:false});n.color.close="[39m";n.bgColor.close="[49m";n.color.ansi=wrapAnsi16();n.color.ansi256=wrapAnsi256();n.color.ansi16m=wrapAnsi16m();n.bgColor.ansi=wrapAnsi16(o);n.bgColor.ansi256=wrapAnsi256(o);n.bgColor.ansi16m=wrapAnsi16m(o);Object.defineProperties(n,{rgbToAnsi256:{value(e,r,t){if(e===r&&r===t){if(e<8){return 16}if(e>248){return 231}return Math.round((e-8)/247*24)+232}return 16+36*Math.round(e/255*5)+6*Math.round(r/255*5)+Math.round(t/255*5)},enumerable:false},hexToRgb:{value(e){const r=/[a-f\d]{6}|[a-f\d]{3}/i.exec(e.toString(16));if(!r){return[0,0,0]}let[t]=r;if(t.length===3){t=[...t].map((e=>e+e)).join("")}const o=Number.parseInt(t,16);return[o>>16&255,o>>8&255,o&255]},enumerable:false},hexToAnsi256:{value:e=>n.rgbToAnsi256(...n.hexToRgb(e)),enumerable:false},ansi256ToAnsi:{value(e){if(e<8){return 30+e}if(e<16){return 90+(e-8)}let r;let t;let o;if(e>=232){r=((e-232)*10+8)/255;t=r;o=r}else{e-=16;const n=e%36;r=Math.floor(e/36)/5;t=Math.floor(n/6)/5;o=n%6/5}const n=Math.max(r,t,o)*2;if(n===0){return 30}let s=30+(Math.round(o)<<2|Math.round(t)<<1|Math.round(r));if(n===2){s+=60}return s},enumerable:false},rgbToAnsi:{value:(e,r,t)=>n.ansi256ToAnsi(n.rgbToAnsi256(e,r,t)),enumerable:false},hexToAnsi:{value:e=>n.ansi256ToAnsi(n.hexToAnsi256(e)),enumerable:false}});return n}const c=assembleStyles();const u=c;const f=e(import.meta.url)("node:process");const h=e(import.meta.url)("node:os");const g=e(import.meta.url)("node:tty");function hasFlag(e,r=f.argv){const t=e.startsWith("-")?"":e.length===1?"-":"--";const o=r.indexOf(t+e);const n=r.indexOf("--");return o!==-1&&(n===-1||o<n)}const{env:b}=f;let d;if(hasFlag("no-color")||hasFlag("no-colors")||hasFlag("color=false")||hasFlag("color=never")){d=0}else if(hasFlag("color")||hasFlag("colors")||hasFlag("color=true")||hasFlag("color=always")){d=1}function envForceColor(){if("FORCE_COLOR"in b){if(b.FORCE_COLOR==="true"){return 1}if(b.FORCE_COLOR==="false"){return 0}return b.FORCE_COLOR.length===0?1:Math.min(Number.parseInt(b.FORCE_COLOR,10),3)}}function translateLevel(e){if(e===0){return false}return{level:e,hasBasic:true,has256:e>=2,has16m:e>=3}}function _supportsColor(e,{streamIsTTY:r,sniffFlags:t=true}={}){const o=envForceColor();if(o!==undefined){d=o}const n=t?d:o;if(n===0){return 0}if(t){if(hasFlag("color=16m")||hasFlag("color=full")||hasFlag("color=truecolor")){return 3}if(hasFlag("color=256")){return 2}}if(e&&!r&&n===undefined){return 0}const s=n||0;if(b.TERM==="dumb"){return s}if(f.platform==="win32"){const e=h.release().split(".");if(Number(e[0])>=10&&Number(e[2])>=10586){return Number(e[2])>=14931?3:2}return 1}if("CI"in b){if(["TRAVIS","CIRCLECI","APPVEYOR","GITLAB_CI","GITHUB_ACTIONS","BUILDKITE","DRONE"].some((e=>e in b))||b.CI_NAME==="codeship"){return 1}return s}if("TEAMCITY_VERSION"in b){return/^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(b.TEAMCITY_VERSION)?1:0}if("TF_BUILD"in b&&"AGENT_NAME"in b){return 1}if(b.COLORTERM==="truecolor"){return 3}if("TERM_PROGRAM"in b){const e=Number.parseInt((b.TERM_PROGRAM_VERSION||"").split(".")[0],10);switch(b.TERM_PROGRAM){case"iTerm.app":return e>=3?3:2;case"Apple_Terminal":return 2}}if(/-256(color)?$/i.test(b.TERM)){return 2}if(/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(b.TERM)){return 1}if("COLORTERM"in b){return 1}return s}function createSupportsColor(e,r={}){const t=_supportsColor(e,{streamIsTTY:e&&e.isTTY,...r});return translateLevel(t)}const m={stdout:createSupportsColor({isTTY:g.isatty(1)}),stderr:createSupportsColor({isTTY:g.isatty(2)})};const p=m;function stringReplaceAll(e,r,t){let o=e.indexOf(r);if(o===-1){return e}const n=r.length;let s=0;let l="";do{l+=e.slice(s,o)+r+t;s=o+n;o=e.indexOf(r,s)}while(o!==-1);l+=e.slice(s);return l}function stringEncaseCRLFWithFirstIndex(e,r,t,o){let n=0;let s="";do{const l=e[o-1]==="\r";s+=e.slice(n,l?o-1:o)+r+(l?"\r\n":"\n")+t;n=o+1;o=e.indexOf("\n",n)}while(o!==-1);s+=e.slice(n);return s}const{stdout:O,stderr:v}=p;const C=Symbol("GENERATOR");const T=Symbol("STYLER");const R=Symbol("IS_EMPTY");const y=["ansi","ansi","ansi256","ansi16m"];const A=Object.create(null);const applyOptions=(e,r={})=>{if(r.level&&!(Number.isInteger(r.level)&&r.level>=0&&r.level<=3)){throw new Error("The `level` option should be an integer from 0 to 3")}const t=O?O.level:0;e.level=r.level===undefined?t:r.level};class Chalk{constructor(e){return chalkFactory(e)}}const chalkFactory=e=>{const chalk=(...e)=>e.join(" ");applyOptions(chalk,e);Object.setPrototypeOf(chalk,createChalk.prototype);return chalk};function createChalk(e){return chalkFactory(e)}Object.setPrototypeOf(createChalk.prototype,Function.prototype);for(const[e,r]of Object.entries(u)){A[e]={get(){const t=createBuilder(this,createStyler(r.open,r.close,this[T]),this[R]);Object.defineProperty(this,e,{value:t});return t}}}A.visible={get(){const e=createBuilder(this,this[T],true);Object.defineProperty(this,"visible",{value:e});return e}};const getModelAnsi=(e,r,t,...o)=>{if(e==="rgb"){if(r==="ansi16m"){return u[t].ansi16m(...o)}if(r==="ansi256"){return u[t].ansi256(u.rgbToAnsi256(...o))}return u[t].ansi(u.rgbToAnsi(...o))}if(e==="hex"){return getModelAnsi("rgb",r,t,...u.hexToRgb(...o))}return u[t][e](...o)};const E=["rgb","hex","ansi256"];for(const e of E){A[e]={get(){const{level:r}=this;return function(...t){const o=createStyler(getModelAnsi(e,y[r],"color",...t),u.color.close,this[T]);return createBuilder(this,o,this[R])}}};const r="bg"+e[0].toUpperCase()+e.slice(1);A[r]={get(){const{level:r}=this;return function(...t){const o=createStyler(getModelAnsi(e,y[r],"bgColor",...t),u.bgColor.close,this[T]);return createBuilder(this,o,this[R])}}}}const M=Object.defineProperties((()=>{}),{...A,level:{enumerable:true,get(){return this[C].level},set(e){this[C].level=e}}});const createStyler=(e,r,t)=>{let o;let n;if(t===undefined){o=e;n=r}else{o=t.openAll+e;n=r+t.closeAll}return{open:e,close:r,openAll:o,closeAll:n,parent:t}};const createBuilder=(e,r,t)=>{const builder=(...e)=>applyStyle(builder,e.length===1?""+e[0]:e.join(" "));Object.setPrototypeOf(builder,M);builder[C]=e;builder[T]=r;builder[R]=t;return builder};const applyStyle=(e,r)=>{if(e.level<=0||!r){return e[R]?"":r}let t=e[T];if(t===undefined){return r}const{openAll:o,closeAll:n}=t;if(r.includes("")){while(t!==undefined){r=stringReplaceAll(r,t.close,t.open);t=t.parent}}const s=r.indexOf("\n");if(s!==-1){r=stringEncaseCRLFWithFirstIndex(r,n,o,s)}return o+r+n};Object.defineProperties(createChalk.prototype,A);const B=createChalk();const F=createChalk({level:v?v.level:0});const j=B;var I=t.cX;var k=t.Z8;var x=t.z7;var N=t.Zj;var L=t.Yf;var P=t.O9;var _=t.ZP;var w=t.oL;var S=t.B2;var Y=t.kV;var G=t.LY;var $=t.hH;var V=t.Nj;export{I as Chalk,k as backgroundColorNames,x as backgroundColors,N as chalkStderr,L as colorNames,P as colors,_ as default,w as foregroundColorNames,S as foregroundColors,Y as modifierNames,G as modifiers,$ as supportsColor,V as supportsColorStderr};