module.exports=(()=>{var e={192:(e,r,t)=>{const o=t(118);const n=/^(.+?)\s+from\s+(?:"([^"]+)"|'([^']+)'|(global))$/;const s=/^:import\((?:"([^"]+)"|'([^']+)')\)/;const c=1;function addImportToGraph(e,r,t,o){const n=r+"_"+"siblings";const s=r+"_"+e;if(o[s]!==c){if(!Array.isArray(o[n])){o[n]=[]}const r=o[n];if(Array.isArray(t[e])){t[e]=t[e].concat(r)}else{t[e]=r.slice()}o[s]=c;r.push(e)}}e.exports=((e={})=>{let r=0;const t=typeof e.createImportedName!=="function"?e=>`i__imported_${e.replace(/\W/g,"_")}_${r++}`:e.createImportedName;const c=e.failOnWrongOrder;return{postcssPlugin:"postcss-modules-extract-imports",prepare(){const e={};const r={};const a={};const i={};const p={};return{Once(l,f){l.walkRules(t=>{const o=s.exec(t.selector);if(o){const[,n,s]=o;const c=n||s;addImportToGraph(c,"root",e,r);a[c]=t}});l.walkDecls(/^composes$/,o=>{const s=o.value.match(n);if(!s){return}let c;let[,a,l,f,u]=s;if(u){c=a.split(/\s+/).map(e=>`global(${e})`)}else{const n=l||f;let s=o.parent;let u="";while(s.type!=="root"){u=s.parent.index(s)+"_"+u;s=s.parent}const{selector:_}=o.parent;const d=`_${u}${_}`;addImportToGraph(n,d,e,r);i[n]=o;p[n]=p[n]||{};c=a.split(/\s+/).map(e=>{if(!p[n][e]){p[n][e]=t(e,n)}return p[n][e]})}o.value=c.join(" ")});const u=o(e,c);if(u instanceof Error){const e=u.nodes.find(e=>i.hasOwnProperty(e));const r=i[e];throw r.error("Failed to resolve order of composed modules "+u.nodes.map(e=>"`"+e+"`").join(", ")+".",{plugin:"postcss-modules-extract-imports",word:"composes"})}let _;u.forEach(e=>{const r=p[e];let t=a[e];if(!t&&r){t=f.rule({selector:`:import("${e}")`,raws:{after:"\n"}});if(_){l.insertAfter(_,t)}else{l.prepend(t)}}_=t;if(!r){return}Object.keys(r).forEach(e=>{t.append(f.decl({value:e,prop:r[e],raws:{before:"\n  "}}))})})}}}}});e.exports.postcss=true},118:e=>{const r=2;const t=1;function createError(e,r){const t=new Error("Nondeterministic import's order");const o=r[e];const n=o.find(t=>r[t].indexOf(e)>-1);t.nodes=[e,n];return t}function walkGraph(e,o,n,s,c){if(n[e]===r){return}if(n[e]===t){if(c){return createError(e,o)}return}n[e]=t;const a=o[e];const i=a.length;for(let e=0;e<i;++e){const r=walkGraph(a[e],o,n,s,c);if(r instanceof Error){return r}}n[e]=r;s.push(e)}function topologicalSort(e,r){const t=[];const o={};const n=Object.keys(e);const s=n.length;for(let c=0;c<s;++c){const s=walkGraph(n[c],e,o,t,r);if(s instanceof Error){return s}}return t}e.exports=topologicalSort}};var r={};function __nccwpck_require__(t){if(r[t]){return r[t].exports}var o=r[t]={exports:{}};var n=true;try{e[t](o,o.exports,__nccwpck_require__);n=false}finally{if(n)delete r[t]}return o.exports}__nccwpck_require__.ab=__dirname+"/";return __nccwpck_require__(192)})();