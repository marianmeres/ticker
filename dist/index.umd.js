!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).ticker={})}(this,(function(e){"use strict";const t=e=>"function"==typeof e,n=(e,n="")=>{if(!t(e))throw new TypeError(`${n} Expecting function arg`.trim())},s=(e=void 0,s=null)=>{const r=e=>t(s?.persist)&&s.persist(e);let o=(()=>{const e=new Map,t=t=>(e.has(t)||e.set(t,new Set),e.get(t)),n=(e,n)=>{if("function"!=typeof n)throw new TypeError("Expecting callback function as second argument");return t(e).add(n),()=>t(e).delete(n)};return{publish:(e,n={})=>{t(e).forEach((e=>e(n)))},subscribe:n,subscribeOnce:(e,t)=>{const s=n(e,(e=>{t(e),s()}));return s},unsubscribeAll:t=>e.delete(t)}})(),i=e;r(i);const c=()=>i,u=e=>{i!==e&&(i=e,r(i),o.publish("change",i))};return{set:u,get:c,update:e=>{n(e,"[update]"),u(e(c()))},subscribe:e=>(n(e,"[subscribe]"),e(i),o.subscribe("change",e))}},r=()=>"undefined"!=typeof window?window.performance.now():Date.now(),o=e=>{if(e=parseInt(e,10),Number.isNaN(e)||e<=0)throw new TypeError("Invalid interval. Expecting positive non-zero number of milliseconds.");return e};e.createDelayedWorkerTicker=(e,t=1e3,n=!1)=>{const i=e=>t=o(e),c=(e={})=>({started:0,finished:0,error:null,result:null,...e||{}});i(t);const u=s(c());let a=0,l=n;const f=async()=>{const n=r();let s;try{const t=u.get();u.set(c({started:n})),s=await e(t),l&&u.set(c({started:n,finished:r(),result:s}))}catch(e){l&&u.set(c({started:n,finished:r(),error:e}))}l&&(a&&clearTimeout(a),a=setTimeout(f,t))},d={subscribe:u.subscribe,start:()=>(l=!0,!a&&f(),d),stop:()=>(a&&(clearTimeout(a),a=0),l=!1,d),setInterval:e=>(i(e),d)};return n&&d.start(),d},e.createTicker=(e=1e3,t=!1,n=null)=>{const i=t=>e=o(t);i(e);const c=s(0);let u=0,a=0;const l=()=>{const t=r();a||=t,c.set(Date.now());const s=r()-a,o=s?s-e:0,i=Math.max(0,e-o);u=setTimeout(l,i),a=r(),((...e)=>{"function"==typeof n&&n.apply(null,e)})({_start:t,_duration:s,_offset:o,_nextInterval:i})},f={subscribe:c.subscribe,start:()=>(!u&&l(),f),stop:()=>(c.set(0),u&&(clearTimeout(u),u=0),a=0,f),setInterval:e=>(i(e),f)};return t&&f.start(),f}}));
