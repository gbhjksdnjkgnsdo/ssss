(()=>{var e={112:(e,r,t)=>{"use strict";var n=t(300).Buffer;var i=t(300).SlowBuffer;e.exports=bufferEq;function bufferEq(e,r){if(!n.isBuffer(e)||!n.isBuffer(r)){return false}if(e.length!==r.length){return false}var t=0;for(var i=0;i<e.length;i++){t|=e[i]^r[i]}return t===0}bufferEq.install=function(){n.prototype.equal=i.prototype.equal=function equal(e){return bufferEq(this,e)}};var a=n.prototype.equal;var o=i.prototype.equal;bufferEq.restore=function(){n.prototype.equal=a;i.prototype.equal=o}},160:(e,r,t)=>{"use strict";var n=t(911).Buffer;var i=t(8);var a=128,o=0,s=32,f=16,u=2,c=f|s|o<<6,l=u|o<<6;function base64Url(e){return e.replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function signatureAsBuffer(e){if(n.isBuffer(e)){return e}else if("string"===typeof e){return n.from(e,"base64")}throw new TypeError("ECDSA signature must be a Base64 string or a Buffer")}function derToJose(e,r){e=signatureAsBuffer(e);var t=i(r);var o=t+1;var s=e.length;var f=0;if(e[f++]!==c){throw new Error('Could not find expected "seq"')}var u=e[f++];if(u===(a|1)){u=e[f++]}if(s-f<u){throw new Error('"seq" specified length of "'+u+'", only "'+(s-f)+'" remaining')}if(e[f++]!==l){throw new Error('Could not find expected "int" for "r"')}var p=e[f++];if(s-f-2<p){throw new Error('"r" specified length of "'+p+'", only "'+(s-f-2)+'" available')}if(o<p){throw new Error('"r" specified length of "'+p+'", max of "'+o+'" is acceptable')}var y=f;f+=p;if(e[f++]!==l){throw new Error('Could not find expected "int" for "s"')}var d=e[f++];if(s-f!==d){throw new Error('"s" specified length of "'+d+'", expected "'+(s-f)+'"')}if(o<d){throw new Error('"s" specified length of "'+d+'", max of "'+o+'" is acceptable')}var v=f;f+=d;if(f!==s){throw new Error('Expected to consume entire buffer, but "'+(s-f)+'" bytes remain')}var b=t-p,m=t-d;var g=n.allocUnsafe(b+p+m+d);for(f=0;f<b;++f){g[f]=0}e.copy(g,f,y+Math.max(-b,0),y+p);f=t;for(var h=f;f<h+m;++f){g[f]=0}e.copy(g,f,v+Math.max(-m,0),v+d);g=g.toString("base64");g=base64Url(g);return g}function countPadding(e,r,t){var n=0;while(r+n<t&&e[r+n]===0){++n}var i=e[r+n]>=a;if(i){--n}return n}function joseToDer(e,r){e=signatureAsBuffer(e);var t=i(r);var o=e.length;if(o!==t*2){throw new TypeError('"'+r+'" signatures must be "'+t*2+'" bytes, saw "'+o+'"')}var s=countPadding(e,0,t);var f=countPadding(e,t,e.length);var u=t-s;var p=t-f;var y=1+1+u+1+1+p;var d=y<a;var v=n.allocUnsafe((d?2:3)+y);var b=0;v[b++]=c;if(d){v[b++]=y}else{v[b++]=a|1;v[b++]=y&255}v[b++]=l;v[b++]=u;if(s<0){v[b++]=0;b+=e.copy(v,b,0,t)}else{b+=e.copy(v,b,s,t)}v[b++]=l;v[b++]=p;if(f<0){v[b++]=0;e.copy(v,b,t)}else{e.copy(v,b,t+f)}return v}e.exports={derToJose:derToJose,joseToDer:joseToDer}},8:e=>{"use strict";function getParamSize(e){var r=(e/8|0)+(e%8===0?0:1);return r}var r={ES256:getParamSize(256),ES384:getParamSize(384),ES512:getParamSize(521)};function getParamBytesForAlg(e){var t=r[e];if(t){return t}throw new Error('Unknown algorithm "'+e+'"')}e.exports=getParamBytesForAlg},467:(e,r,t)=>{var n=t(111);e.exports=function(e,r){r=r||{};var t=n.decode(e,r);if(!t){return null}var i=t.payload;if(typeof i==="string"){try{var a=JSON.parse(i);if(a!==null&&typeof a==="object"){i=a}}catch(e){}}if(r.complete===true){return{header:t.header,payload:i,signature:t.signature}}return i}},296:(e,r,t)=>{e.exports={decode:t(467),verify:t(906),sign:t(585),JsonWebTokenError:t(608),NotBeforeError:t(46),TokenExpiredError:t(49)}},608:e=>{var JsonWebTokenError=function(e,r){Error.call(this,e);if(Error.captureStackTrace){Error.captureStackTrace(this,this.constructor)}this.name="JsonWebTokenError";this.message=e;if(r)this.inner=r};JsonWebTokenError.prototype=Object.create(Error.prototype);JsonWebTokenError.prototype.constructor=JsonWebTokenError;e.exports=JsonWebTokenError},46:(e,r,t)=>{var n=t(608);var NotBeforeError=function(e,r){n.call(this,e);this.name="NotBeforeError";this.date=r};NotBeforeError.prototype=Object.create(n.prototype);NotBeforeError.prototype.constructor=NotBeforeError;e.exports=NotBeforeError},49:(e,r,t)=>{var n=t(608);var TokenExpiredError=function(e,r){n.call(this,e);this.name="TokenExpiredError";this.expiredAt=r};TokenExpiredError.prototype=Object.create(n.prototype);TokenExpiredError.prototype.constructor=TokenExpiredError;e.exports=TokenExpiredError},373:(e,r,t)=>{var n=t(849);e.exports=n.satisfies(process.version,"^6.12.0 || >=8.0.0")},511:(e,r,t)=>{var n=t(79);e.exports=function(e,r){var t=r||Math.floor(Date.now()/1e3);if(typeof e==="string"){var i=n(e);if(typeof i==="undefined"){return}return Math.floor(t+i/1e3)}else if(typeof e==="number"){return t+e}else{return}}},585:(e,r,t)=>{var n=t(511);var i=t(373);var a=t(111);var o=t(678);var s=t(505);var f=t(799);var u=t(287);var c=t(443);var l=t(596);var p=t(448);var y=["RS256","RS384","RS512","ES256","ES384","ES512","HS256","HS384","HS512","none"];if(i){y.splice(3,0,"PS256","PS384","PS512")}var d={expiresIn:{isValid:function(e){return f(e)||l(e)&&e},message:'"expiresIn" should be a number of seconds or string representing a timespan'},notBefore:{isValid:function(e){return f(e)||l(e)&&e},message:'"notBefore" should be a number of seconds or string representing a timespan'},audience:{isValid:function(e){return l(e)||Array.isArray(e)},message:'"audience" must be a string or array'},algorithm:{isValid:o.bind(null,y),message:'"algorithm" must be a valid string enum value'},header:{isValid:c,message:'"header" must be an object'},encoding:{isValid:l,message:'"encoding" must be a string'},issuer:{isValid:l,message:'"issuer" must be a string'},subject:{isValid:l,message:'"subject" must be a string'},jwtid:{isValid:l,message:'"jwtid" must be a string'},noTimestamp:{isValid:s,message:'"noTimestamp" must be a boolean'},keyid:{isValid:l,message:'"keyid" must be a string'},mutatePayload:{isValid:s,message:'"mutatePayload" must be a boolean'}};var v={iat:{isValid:u,message:'"iat" should be a number of seconds'},exp:{isValid:u,message:'"exp" should be a number of seconds'},nbf:{isValid:u,message:'"nbf" should be a number of seconds'}};function validate(e,r,t,n){if(!c(t)){throw new Error('Expected "'+n+'" to be a plain object.')}Object.keys(t).forEach((function(i){var a=e[i];if(!a){if(!r){throw new Error('"'+i+'" is not allowed in "'+n+'"')}return}if(!a.isValid(t[i])){throw new Error(a.message)}}))}function validateOptions(e){return validate(d,false,e,"options")}function validatePayload(e){return validate(v,true,e,"payload")}var b={audience:"aud",issuer:"iss",subject:"sub",jwtid:"jti"};var m=["expiresIn","notBefore","noTimestamp","audience","issuer","subject","jwtid"];e.exports=function(e,r,t,i){if(typeof t==="function"){i=t;t={}}else{t=t||{}}var o=typeof e==="object"&&!Buffer.isBuffer(e);var s=Object.assign({alg:t.algorithm||"HS256",typ:o?"JWT":undefined,kid:t.keyid},t.header);function failure(e){if(i){return i(e)}throw e}if(!r&&t.algorithm!=="none"){return failure(new Error("secretOrPrivateKey must have a value"))}if(typeof e==="undefined"){return failure(new Error("payload is required"))}else if(o){try{validatePayload(e)}catch(e){return failure(e)}if(!t.mutatePayload){e=Object.assign({},e)}}else{var f=m.filter((function(e){return typeof t[e]!=="undefined"}));if(f.length>0){return failure(new Error("invalid "+f.join(",")+" option for "+typeof e+" payload"))}}if(typeof e.exp!=="undefined"&&typeof t.expiresIn!=="undefined"){return failure(new Error('Bad "options.expiresIn" option the payload already has an "exp" property.'))}if(typeof e.nbf!=="undefined"&&typeof t.notBefore!=="undefined"){return failure(new Error('Bad "options.notBefore" option the payload already has an "nbf" property.'))}try{validateOptions(t)}catch(e){return failure(e)}var u=e.iat||Math.floor(Date.now()/1e3);if(t.noTimestamp){delete e.iat}else if(o){e.iat=u}if(typeof t.notBefore!=="undefined"){try{e.nbf=n(t.notBefore,u)}catch(e){return failure(e)}if(typeof e.nbf==="undefined"){return failure(new Error('"notBefore" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'))}}if(typeof t.expiresIn!=="undefined"&&typeof e==="object"){try{e.exp=n(t.expiresIn,u)}catch(e){return failure(e)}if(typeof e.exp==="undefined"){return failure(new Error('"expiresIn" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'))}}Object.keys(b).forEach((function(r){var n=b[r];if(typeof t[r]!=="undefined"){if(typeof e[n]!=="undefined"){return failure(new Error('Bad "options.'+r+'" option. The payload already has an "'+n+'" property.'))}e[n]=t[r]}}));var c=t.encoding||"utf8";if(typeof i==="function"){i=i&&p(i);a.createSign({header:s,privateKey:r,payload:e,encoding:c}).once("error",i).once("done",(function(e){i(null,e)}))}else{return a.sign({header:s,payload:e,secret:r,encoding:c})}}},906:(e,r,t)=>{var n=t(608);var i=t(46);var a=t(49);var o=t(467);var s=t(511);var f=t(373);var u=t(111);var c=["RS256","RS384","RS512","ES256","ES384","ES512"];var l=["RS256","RS384","RS512"];var p=["HS256","HS384","HS512"];if(f){c.splice(3,0,"PS256","PS384","PS512");l.splice(3,0,"PS256","PS384","PS512")}e.exports=function(e,r,t,f){if(typeof t==="function"&&!f){f=t;t={}}if(!t){t={}}t=Object.assign({},t);var y;if(f){y=f}else{y=function(e,r){if(e)throw e;return r}}if(t.clockTimestamp&&typeof t.clockTimestamp!=="number"){return y(new n("clockTimestamp must be a number"))}if(t.nonce!==undefined&&(typeof t.nonce!=="string"||t.nonce.trim()==="")){return y(new n("nonce must be a non-empty string"))}var d=t.clockTimestamp||Math.floor(Date.now()/1e3);if(!e){return y(new n("jwt must be provided"))}if(typeof e!=="string"){return y(new n("jwt must be a string"))}var v=e.split(".");if(v.length!==3){return y(new n("jwt malformed"))}var b;try{b=o(e,{complete:true})}catch(e){return y(e)}if(!b){return y(new n("invalid token"))}var m=b.header;var g;if(typeof r==="function"){if(!f){return y(new n("verify must be called asynchronous if secret or public key is provided as a callback"))}g=r}else{g=function(e,t){return t(null,r)}}return g(m,(function(r,o){if(r){return y(new n("error in secret or public key callback: "+r.message))}var f=v[2].trim()!=="";if(!f&&o){return y(new n("jwt signature is required"))}if(f&&!o){return y(new n("secret or public key must be provided"))}if(!f&&!t.algorithms){t.algorithms=["none"]}if(!t.algorithms){t.algorithms=~o.toString().indexOf("BEGIN CERTIFICATE")||~o.toString().indexOf("BEGIN PUBLIC KEY")?c:~o.toString().indexOf("BEGIN RSA PUBLIC KEY")?l:p}if(!~t.algorithms.indexOf(b.header.alg)){return y(new n("invalid algorithm"))}var g;try{g=u.verify(e,b.header.alg,o)}catch(e){return y(e)}if(!g){return y(new n("invalid signature"))}var h=b.payload;if(typeof h.nbf!=="undefined"&&!t.ignoreNotBefore){if(typeof h.nbf!=="number"){return y(new n("invalid nbf value"))}if(h.nbf>d+(t.clockTolerance||0)){return y(new i("jwt not active",new Date(h.nbf*1e3)))}}if(typeof h.exp!=="undefined"&&!t.ignoreExpiration){if(typeof h.exp!=="number"){return y(new n("invalid exp value"))}if(d>=h.exp+(t.clockTolerance||0)){return y(new a("jwt expired",new Date(h.exp*1e3)))}}if(t.audience){var S=Array.isArray(t.audience)?t.audience:[t.audience];var w=Array.isArray(h.aud)?h.aud:[h.aud];var j=w.some((function(e){return S.some((function(r){return r instanceof RegExp?r.test(e):r===e}))}));if(!j){return y(new n("jwt audience invalid. expected: "+S.join(" or ")))}}if(t.issuer){var E=typeof t.issuer==="string"&&h.iss!==t.issuer||Array.isArray(t.issuer)&&t.issuer.indexOf(h.iss)===-1;if(E){return y(new n("jwt issuer invalid. expected: "+t.issuer))}}if(t.subject){if(h.sub!==t.subject){return y(new n("jwt subject invalid. expected: "+t.subject))}}if(t.jwtid){if(h.jti!==t.jwtid){return y(new n("jwt jwtid invalid. expected: "+t.jwtid))}}if(t.nonce){if(h.nonce!==t.nonce){return y(new n("jwt nonce invalid. expected: "+t.nonce))}}if(t.maxAge){if(typeof h.iat!=="number"){return y(new n("iat required when maxAge is specified"))}var x=s(t.maxAge,h.iat);if(typeof x==="undefined"){return y(new n('"maxAge" should be a number of seconds or string representing a timespan eg: "1d", "20h", 60'))}if(d>=x+(t.clockTolerance||0)){return y(new a("maxAge exceeded",new Date(x*1e3)))}}if(t.complete===true){var O=b.signature;return y(null,{header:m,payload:h,signature:O})}return y(null,h)}))}},251:(e,r,t)=>{var n=t(112);var i=t(911).Buffer;var a=t(113);var o=t(160);var s=t(837);var f='"%s" is not a valid algorithm.\n  Supported algorithms are:\n  "HS256", "HS384", "HS512", "RS256", "RS384", "RS512", "PS256", "PS384", "PS512", "ES256", "ES384", "ES512" and "none".';var u="secret must be a string or buffer";var c="key must be a string or a buffer";var l="key must be a string, a buffer or an object";var p=typeof a.createPublicKey==="function";if(p){c+=" or a KeyObject";u+="or a KeyObject"}function checkIsPublicKey(e){if(i.isBuffer(e)){return}if(typeof e==="string"){return}if(!p){throw typeError(c)}if(typeof e!=="object"){throw typeError(c)}if(typeof e.type!=="string"){throw typeError(c)}if(typeof e.asymmetricKeyType!=="string"){throw typeError(c)}if(typeof e.export!=="function"){throw typeError(c)}}function checkIsPrivateKey(e){if(i.isBuffer(e)){return}if(typeof e==="string"){return}if(typeof e==="object"){return}throw typeError(l)}function checkIsSecretKey(e){if(i.isBuffer(e)){return}if(typeof e==="string"){return e}if(!p){throw typeError(u)}if(typeof e!=="object"){throw typeError(u)}if(e.type!=="secret"){throw typeError(u)}if(typeof e.export!=="function"){throw typeError(u)}}function fromBase64(e){return e.replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function toBase64(e){e=e.toString();var r=4-e.length%4;if(r!==4){for(var t=0;t<r;++t){e+="="}}return e.replace(/\-/g,"+").replace(/_/g,"/")}function typeError(e){var r=[].slice.call(arguments,1);var t=s.format.bind(s,e).apply(null,r);return new TypeError(t)}function bufferOrString(e){return i.isBuffer(e)||typeof e==="string"}function normalizeInput(e){if(!bufferOrString(e))e=JSON.stringify(e);return e}function createHmacSigner(e){return function sign(r,t){checkIsSecretKey(t);r=normalizeInput(r);var n=a.createHmac("sha"+e,t);var i=(n.update(r),n.digest("base64"));return fromBase64(i)}}function createHmacVerifier(e){return function verify(r,t,a){var o=createHmacSigner(e)(r,a);return n(i.from(t),i.from(o))}}function createKeySigner(e){return function sign(r,t){checkIsPrivateKey(t);r=normalizeInput(r);var n=a.createSign("RSA-SHA"+e);var i=(n.update(r),n.sign(t,"base64"));return fromBase64(i)}}function createKeyVerifier(e){return function verify(r,t,n){checkIsPublicKey(n);r=normalizeInput(r);t=toBase64(t);var i=a.createVerify("RSA-SHA"+e);i.update(r);return i.verify(n,t,"base64")}}function createPSSKeySigner(e){return function sign(r,t){checkIsPrivateKey(t);r=normalizeInput(r);var n=a.createSign("RSA-SHA"+e);var i=(n.update(r),n.sign({key:t,padding:a.constants.RSA_PKCS1_PSS_PADDING,saltLength:a.constants.RSA_PSS_SALTLEN_DIGEST},"base64"));return fromBase64(i)}}function createPSSKeyVerifier(e){return function verify(r,t,n){checkIsPublicKey(n);r=normalizeInput(r);t=toBase64(t);var i=a.createVerify("RSA-SHA"+e);i.update(r);return i.verify({key:n,padding:a.constants.RSA_PKCS1_PSS_PADDING,saltLength:a.constants.RSA_PSS_SALTLEN_DIGEST},t,"base64")}}function createECDSASigner(e){var r=createKeySigner(e);return function sign(){var t=r.apply(null,arguments);t=o.derToJose(t,"ES"+e);return t}}function createECDSAVerifer(e){var r=createKeyVerifier(e);return function verify(t,n,i){n=o.joseToDer(n,"ES"+e).toString("base64");var a=r(t,n,i);return a}}function createNoneSigner(){return function sign(){return""}}function createNoneVerifier(){return function verify(e,r){return r===""}}e.exports=function jwa(e){var r={hs:createHmacSigner,rs:createKeySigner,ps:createPSSKeySigner,es:createECDSASigner,none:createNoneSigner};var t={hs:createHmacVerifier,rs:createKeyVerifier,ps:createPSSKeyVerifier,es:createECDSAVerifer,none:createNoneVerifier};var n=e.match(/^(RS|PS|ES|HS)(256|384|512)$|^(none)$/i);if(!n)throw typeError(f,e);var i=(n[1]||n[3]).toLowerCase();var a=n[2];return{sign:r[i](a),verify:t[i](a)}}},111:(e,r,t)=>{var n=t(409);var i=t(851);var a=["HS256","HS384","HS512","RS256","RS384","RS512","PS256","PS384","PS512","ES256","ES384","ES512"];r.ALGORITHMS=a;r.sign=n.sign;r.verify=i.verify;r.decode=i.decode;r.isValid=i.isValid;r.createSign=function createSign(e){return new n(e)};r.createVerify=function createVerify(e){return new i(e)}},626:(e,r,t)=>{var n=t(55).Buffer;var i=t(781);var a=t(837);function DataStream(e){this.buffer=null;this.writable=true;this.readable=true;if(!e){this.buffer=n.alloc(0);return this}if(typeof e.pipe==="function"){this.buffer=n.alloc(0);e.pipe(this);return this}if(e.length||typeof e==="object"){this.buffer=e;this.writable=false;process.nextTick(function(){this.emit("end",e);this.readable=false;this.emit("close")}.bind(this));return this}throw new TypeError("Unexpected data type ("+typeof e+")")}a.inherits(DataStream,i);DataStream.prototype.write=function write(e){this.buffer=n.concat([this.buffer,n.from(e)]);this.emit("data",e)};DataStream.prototype.end=function end(e){if(e)this.write(e);this.emit("end",e);this.emit("close");this.writable=false;this.readable=false};e.exports=DataStream},409:(e,r,t)=>{var n=t(55).Buffer;var i=t(626);var a=t(251);var o=t(781);var s=t(730);var f=t(837);function base64url(e,r){return n.from(e,r).toString("base64").replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_")}function jwsSecuredInput(e,r,t){t=t||"utf8";var n=base64url(s(e),"binary");var i=base64url(s(r),t);return f.format("%s.%s",n,i)}function jwsSign(e){var r=e.header;var t=e.payload;var n=e.secret||e.privateKey;var i=e.encoding;var o=a(r.alg);var s=jwsSecuredInput(r,t,i);var u=o.sign(s,n);return f.format("%s.%s",s,u)}function SignStream(e){var r=e.secret||e.privateKey||e.key;var t=new i(r);this.readable=true;this.header=e.header;this.encoding=e.encoding;this.secret=this.privateKey=this.key=t;this.payload=new i(e.payload);this.secret.once("close",function(){if(!this.payload.writable&&this.readable)this.sign()}.bind(this));this.payload.once("close",function(){if(!this.secret.writable&&this.readable)this.sign()}.bind(this))}f.inherits(SignStream,o);SignStream.prototype.sign=function sign(){try{var e=jwsSign({header:this.header,payload:this.payload.buffer,secret:this.secret.buffer,encoding:this.encoding});this.emit("done",e);this.emit("data",e);this.emit("end");this.readable=false;return e}catch(e){this.readable=false;this.emit("error",e);this.emit("close")}};SignStream.sign=jwsSign;e.exports=SignStream},730:(e,r,t)=>{var n=t(300).Buffer;e.exports=function toString(e){if(typeof e==="string")return e;if(typeof e==="number"||n.isBuffer(e))return e.toString();return JSON.stringify(e)}},851:(e,r,t)=>{var n=t(55).Buffer;var i=t(626);var a=t(251);var o=t(781);var s=t(730);var f=t(837);var u=/^[a-zA-Z0-9\-_]+?\.[a-zA-Z0-9\-_]+?\.([a-zA-Z0-9\-_]+)?$/;function isObject(e){return Object.prototype.toString.call(e)==="[object Object]"}function safeJsonParse(e){if(isObject(e))return e;try{return JSON.parse(e)}catch(e){return undefined}}function headerFromJWS(e){var r=e.split(".",1)[0];return safeJsonParse(n.from(r,"base64").toString("binary"))}function securedInputFromJWS(e){return e.split(".",2).join(".")}function signatureFromJWS(e){return e.split(".")[2]}function payloadFromJWS(e,r){r=r||"utf8";var t=e.split(".")[1];return n.from(t,"base64").toString(r)}function isValidJws(e){return u.test(e)&&!!headerFromJWS(e)}function jwsVerify(e,r,t){if(!r){var n=new Error("Missing algorithm parameter for jws.verify");n.code="MISSING_ALGORITHM";throw n}e=s(e);var i=signatureFromJWS(e);var o=securedInputFromJWS(e);var f=a(r);return f.verify(o,i,t)}function jwsDecode(e,r){r=r||{};e=s(e);if(!isValidJws(e))return null;var t=headerFromJWS(e);if(!t)return null;var n=payloadFromJWS(e);if(t.typ==="JWT"||r.json)n=JSON.parse(n,r.encoding);return{header:t,payload:n,signature:signatureFromJWS(e)}}function VerifyStream(e){e=e||{};var r=e.secret||e.publicKey||e.key;var t=new i(r);this.readable=true;this.algorithm=e.algorithm;this.encoding=e.encoding;this.secret=this.publicKey=this.key=t;this.signature=new i(e.signature);this.secret.once("close",function(){if(!this.signature.writable&&this.readable)this.verify()}.bind(this));this.signature.once("close",function(){if(!this.secret.writable&&this.readable)this.verify()}.bind(this))}f.inherits(VerifyStream,o);VerifyStream.prototype.verify=function verify(){try{var e=jwsVerify(this.signature.buffer,this.algorithm,this.key.buffer);var r=jwsDecode(this.signature.buffer,this.encoding);this.emit("done",e,r);this.emit("data",e);this.emit("end");this.readable=false;return e}catch(e){this.readable=false;this.emit("error",e);this.emit("close")}};VerifyStream.decode=jwsDecode;VerifyStream.isValid=isValidJws;VerifyStream.verify=jwsVerify;e.exports=VerifyStream},678:e=>{var r=1/0,t=9007199254740991,n=17976931348623157e292,i=0/0;var a="[object Arguments]",o="[object Function]",s="[object GeneratorFunction]",f="[object String]",u="[object Symbol]";var c=/^\s+|\s+$/g;var l=/^[-+]0x[0-9a-f]+$/i;var p=/^0b[01]+$/i;var y=/^0o[0-7]+$/i;var d=/^(?:0|[1-9]\d*)$/;var v=parseInt;function arrayMap(e,r){var t=-1,n=e?e.length:0,i=Array(n);while(++t<n){i[t]=r(e[t],t,e)}return i}function baseFindIndex(e,r,t,n){var i=e.length,a=t+(n?1:-1);while(n?a--:++a<i){if(r(e[a],a,e)){return a}}return-1}function baseIndexOf(e,r,t){if(r!==r){return baseFindIndex(e,baseIsNaN,t)}var n=t-1,i=e.length;while(++n<i){if(e[n]===r){return n}}return-1}function baseIsNaN(e){return e!==e}function baseTimes(e,r){var t=-1,n=Array(e);while(++t<e){n[t]=r(t)}return n}function baseValues(e,r){return arrayMap(r,(function(r){return e[r]}))}function overArg(e,r){return function(t){return e(r(t))}}var b=Object.prototype;var m=b.hasOwnProperty;var g=b.toString;var h=b.propertyIsEnumerable;var S=overArg(Object.keys,Object),w=Math.max;function arrayLikeKeys(e,r){var t=j(e)||isArguments(e)?baseTimes(e.length,String):[];var n=t.length,i=!!n;for(var a in e){if((r||m.call(e,a))&&!(i&&(a=="length"||isIndex(a,n)))){t.push(a)}}return t}function baseKeys(e){if(!isPrototype(e)){return S(e)}var r=[];for(var t in Object(e)){if(m.call(e,t)&&t!="constructor"){r.push(t)}}return r}function isIndex(e,r){r=r==null?t:r;return!!r&&(typeof e=="number"||d.test(e))&&(e>-1&&e%1==0&&e<r)}function isPrototype(e){var r=e&&e.constructor,t=typeof r=="function"&&r.prototype||b;return e===t}function includes(e,r,t,n){e=isArrayLike(e)?e:values(e);t=t&&!n?toInteger(t):0;var i=e.length;if(t<0){t=w(i+t,0)}return isString(e)?t<=i&&e.indexOf(r,t)>-1:!!i&&baseIndexOf(e,r,t)>-1}function isArguments(e){return isArrayLikeObject(e)&&m.call(e,"callee")&&(!h.call(e,"callee")||g.call(e)==a)}var j=Array.isArray;function isArrayLike(e){return e!=null&&isLength(e.length)&&!isFunction(e)}function isArrayLikeObject(e){return isObjectLike(e)&&isArrayLike(e)}function isFunction(e){var r=isObject(e)?g.call(e):"";return r==o||r==s}function isLength(e){return typeof e=="number"&&e>-1&&e%1==0&&e<=t}function isObject(e){var r=typeof e;return!!e&&(r=="object"||r=="function")}function isObjectLike(e){return!!e&&typeof e=="object"}function isString(e){return typeof e=="string"||!j(e)&&isObjectLike(e)&&g.call(e)==f}function isSymbol(e){return typeof e=="symbol"||isObjectLike(e)&&g.call(e)==u}function toFinite(e){if(!e){return e===0?e:0}e=toNumber(e);if(e===r||e===-r){var t=e<0?-1:1;return t*n}return e===e?e:0}function toInteger(e){var r=toFinite(e),t=r%1;return r===r?t?r-t:r:0}function toNumber(e){if(typeof e=="number"){return e}if(isSymbol(e)){return i}if(isObject(e)){var r=typeof e.valueOf=="function"?e.valueOf():e;e=isObject(r)?r+"":r}if(typeof e!="string"){return e===0?e:+e}e=e.replace(c,"");var t=p.test(e);return t||y.test(e)?v(e.slice(2),t?2:8):l.test(e)?i:+e}function keys(e){return isArrayLike(e)?arrayLikeKeys(e):baseKeys(e)}function values(e){return e?baseValues(e,keys(e)):[]}e.exports=includes},505:e=>{var r="[object Boolean]";var t=Object.prototype;var n=t.toString;function isBoolean(e){return e===true||e===false||isObjectLike(e)&&n.call(e)==r}function isObjectLike(e){return!!e&&typeof e=="object"}e.exports=isBoolean},799:e=>{var r=1/0,t=17976931348623157e292,n=0/0;var i="[object Symbol]";var a=/^\s+|\s+$/g;var o=/^[-+]0x[0-9a-f]+$/i;var s=/^0b[01]+$/i;var f=/^0o[0-7]+$/i;var u=parseInt;var c=Object.prototype;var l=c.toString;function isInteger(e){return typeof e=="number"&&e==toInteger(e)}function isObject(e){var r=typeof e;return!!e&&(r=="object"||r=="function")}function isObjectLike(e){return!!e&&typeof e=="object"}function isSymbol(e){return typeof e=="symbol"||isObjectLike(e)&&l.call(e)==i}function toFinite(e){if(!e){return e===0?e:0}e=toNumber(e);if(e===r||e===-r){var n=e<0?-1:1;return n*t}return e===e?e:0}function toInteger(e){var r=toFinite(e),t=r%1;return r===r?t?r-t:r:0}function toNumber(e){if(typeof e=="number"){return e}if(isSymbol(e)){return n}if(isObject(e)){var r=typeof e.valueOf=="function"?e.valueOf():e;e=isObject(r)?r+"":r}if(typeof e!="string"){return e===0?e:+e}e=e.replace(a,"");var t=s.test(e);return t||f.test(e)?u(e.slice(2),t?2:8):o.test(e)?n:+e}e.exports=isInteger},287:e=>{var r="[object Number]";var t=Object.prototype;var n=t.toString;function isObjectLike(e){return!!e&&typeof e=="object"}function isNumber(e){return typeof e=="number"||isObjectLike(e)&&n.call(e)==r}e.exports=isNumber},443:e=>{var r="[object Object]";function isHostObject(e){var r=false;if(e!=null&&typeof e.toString!="function"){try{r=!!(e+"")}catch(e){}}return r}function overArg(e,r){return function(t){return e(r(t))}}var t=Function.prototype,n=Object.prototype;var i=t.toString;var a=n.hasOwnProperty;var o=i.call(Object);var s=n.toString;var f=overArg(Object.getPrototypeOf,Object);function isObjectLike(e){return!!e&&typeof e=="object"}function isPlainObject(e){if(!isObjectLike(e)||s.call(e)!=r||isHostObject(e)){return false}var t=f(e);if(t===null){return true}var n=a.call(t,"constructor")&&t.constructor;return typeof n=="function"&&n instanceof n&&i.call(n)==o}e.exports=isPlainObject},596:e=>{var r="[object String]";var t=Object.prototype;var n=t.toString;var i=Array.isArray;function isObjectLike(e){return!!e&&typeof e=="object"}function isString(e){return typeof e=="string"||!i(e)&&isObjectLike(e)&&n.call(e)==r}e.exports=isString},448:e=>{var r="Expected a function";var t=1/0,n=17976931348623157e292,i=0/0;var a="[object Symbol]";var o=/^\s+|\s+$/g;var s=/^[-+]0x[0-9a-f]+$/i;var f=/^0b[01]+$/i;var u=/^0o[0-7]+$/i;var c=parseInt;var l=Object.prototype;var p=l.toString;function before(e,t){var n;if(typeof t!="function"){throw new TypeError(r)}e=toInteger(e);return function(){if(--e>0){n=t.apply(this,arguments)}if(e<=1){t=undefined}return n}}function once(e){return before(2,e)}function isObject(e){var r=typeof e;return!!e&&(r=="object"||r=="function")}function isObjectLike(e){return!!e&&typeof e=="object"}function isSymbol(e){return typeof e=="symbol"||isObjectLike(e)&&p.call(e)==a}function toFinite(e){if(!e){return e===0?e:0}e=toNumber(e);if(e===t||e===-t){var r=e<0?-1:1;return r*n}return e===e?e:0}function toInteger(e){var r=toFinite(e),t=r%1;return r===r?t?r-t:r:0}function toNumber(e){if(typeof e=="number"){return e}if(isSymbol(e)){return i}if(isObject(e)){var r=typeof e.valueOf=="function"?e.valueOf():e;e=isObject(r)?r+"":r}if(typeof e!="string"){return e===0?e:+e}e=e.replace(o,"");var t=f.test(e);return t||u.test(e)?c(e.slice(2),t?2:8):s.test(e)?i:+e}e.exports=once},79:e=>{var r=1e3;var t=r*60;var n=t*60;var i=n*24;var a=i*7;var o=i*365.25;e.exports=function(e,r){r=r||{};var t=typeof e;if(t==="string"&&e.length>0){return parse(e)}else if(t==="number"&&isFinite(e)){return r.long?fmtLong(e):fmtShort(e)}throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(e))};function parse(e){e=String(e);if(e.length>100){return}var s=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(e);if(!s){return}var f=parseFloat(s[1]);var u=(s[2]||"ms").toLowerCase();switch(u){case"years":case"year":case"yrs":case"yr":case"y":return f*o;case"weeks":case"week":case"w":return f*a;case"days":case"day":case"d":return f*i;case"hours":case"hour":case"hrs":case"hr":case"h":return f*n;case"minutes":case"minute":case"mins":case"min":case"m":return f*t;case"seconds":case"second":case"secs":case"sec":case"s":return f*r;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return f;default:return undefined}}function fmtShort(e){var a=Math.abs(e);if(a>=i){return Math.round(e/i)+"d"}if(a>=n){return Math.round(e/n)+"h"}if(a>=t){return Math.round(e/t)+"m"}if(a>=r){return Math.round(e/r)+"s"}return e+"ms"}function fmtLong(e){var a=Math.abs(e);if(a>=i){return plural(e,a,i,"day")}if(a>=n){return plural(e,a,n,"hour")}if(a>=t){return plural(e,a,t,"minute")}if(a>=r){return plural(e,a,r,"second")}return e+" ms"}function plural(e,r,t,n){var i=r>=t*1.5;return Math.round(e/t)+" "+n+(i?"s":"")}},55:(e,r,t)=>{var n=t(300);var i=n.Buffer;function copyProps(e,r){for(var t in e){r[t]=e[t]}}if(i.from&&i.alloc&&i.allocUnsafe&&i.allocUnsafeSlow){e.exports=n}else{copyProps(n,r);r.Buffer=SafeBuffer}function SafeBuffer(e,r,t){return i(e,r,t)}SafeBuffer.prototype=Object.create(i.prototype);copyProps(i,SafeBuffer);SafeBuffer.from=function(e,r,t){if(typeof e==="number"){throw new TypeError("Argument must not be a number")}return i(e,r,t)};SafeBuffer.alloc=function(e,r,t){if(typeof e!=="number"){throw new TypeError("Argument must be a number")}var n=i(e);if(r!==undefined){if(typeof t==="string"){n.fill(r,t)}else{n.fill(r)}}else{n.fill(0)}return n};SafeBuffer.allocUnsafe=function(e){if(typeof e!=="number"){throw new TypeError("Argument must be a number")}return i(e)};SafeBuffer.allocUnsafeSlow=function(e){if(typeof e!=="number"){throw new TypeError("Argument must be a number")}return n.SlowBuffer(e)}},911:(e,r,t)=>{
/*! safe-buffer. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */
var n=t(300);var i=n.Buffer;function copyProps(e,r){for(var t in e){r[t]=e[t]}}if(i.from&&i.alloc&&i.allocUnsafe&&i.allocUnsafeSlow){e.exports=n}else{copyProps(n,r);r.Buffer=SafeBuffer}function SafeBuffer(e,r,t){return i(e,r,t)}SafeBuffer.prototype=Object.create(i.prototype);copyProps(i,SafeBuffer);SafeBuffer.from=function(e,r,t){if(typeof e==="number"){throw new TypeError("Argument must not be a number")}return i(e,r,t)};SafeBuffer.alloc=function(e,r,t){if(typeof e!=="number"){throw new TypeError("Argument must be a number")}var n=i(e);if(r!==undefined){if(typeof t==="string"){n.fill(r,t)}else{n.fill(r)}}else{n.fill(0)}return n};SafeBuffer.allocUnsafe=function(e){if(typeof e!=="number"){throw new TypeError("Argument must be a number")}return i(e)};SafeBuffer.allocUnsafeSlow=function(e){if(typeof e!=="number"){throw new TypeError("Argument must be a number")}return n.SlowBuffer(e)}},300:e=>{"use strict";e.exports=require("buffer")},113:e=>{"use strict";e.exports=require("crypto")},849:e=>{"use strict";e.exports=require("next/dist/compiled/semver")},781:e=>{"use strict";e.exports=require("stream")},837:e=>{"use strict";e.exports=require("util")}};var r={};function __nccwpck_require__(t){var n=r[t];if(n!==undefined){return n.exports}var i=r[t]={exports:{}};var a=true;try{e[t](i,i.exports,__nccwpck_require__);a=false}finally{if(a)delete r[t]}return i.exports}if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";var t=__nccwpck_require__(296);module.exports=t})();