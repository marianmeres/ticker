!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).ticker={})}(this,(function(e){"use strict";const t=e=>"function"==typeof e,n=(e,n="")=>{if(!t(e))throw new TypeError(`${n} Expecting function arg`.trim())},s=()=>"undefined"!=typeof window?window.performance.now():Date.now();e.createTicker=(e=1e3,o=!1,r=null)=>{const i=t=>{if(t=parseInt(t,10),Number.isNaN(t)||t<=0)throw new TypeError("Invalid interval. Expecting positive non-zero number of milliseconds.");e=t};i(e);const c=((e,s=null)=>{const o=e=>t(s?.persist)&&s.persist(e);let r=(()=>{const e=new Map,t=t=>(e.has(t)||e.set(t,new Set),e.get(t)),n=(e,n)=>{if("function"!=typeof n)throw new TypeError("Expecting callback function as second argument");return t(e).add(n),()=>t(e).delete(n)};return{publish:(e,n={})=>{t(e).forEach((e=>e(n)))},subscribe:n,subscribeOnce:(e,t)=>{const s=n(e,(e=>{t(e),s()}));return s},unsubscribeAll:t=>e.delete(t)}})(),i=e;o(i);const c=()=>i,u=e=>{i!==e&&(i=e,o(i),r.publish("change",i))};return{set:u,get:c,update:e=>{n(e,"[update]"),u(e(c()))},subscribe:e=>(n(e,"[subscribe]"),e(i),r.subscribe("change",e))}})(0);let u=0,a=0;const f=()=>{const t=s();a||=t,c.set(Date.now());const n=s()-a,o=n?n-e:0,i=Math.max(0,e-o);u=setTimeout(f,i),a=s(),((...e)=>{"function"==typeof r&&r.apply(null,e)})({_start:t,_duration:n,_offset:o,_nextInterval:i})},l={subscribe:c.subscribe,start:()=>(!u&&f(),l),stop:()=>(c.set(0),u&&(clearTimeout(u),u=0),a=0,l),setInterval:e=>(i(e),l)};return o&&l.start(),l}}));
