"use strict";const e=e=>"function"==typeof e,t=(t,n="")=>{if(!e(t))throw new TypeError(`${n} Expecting function arg`.trim())},n=()=>"undefined"!=typeof window?window.performance.now():Date.now();exports.createTicker=(s=1e3,r=!1,o=null)=>{const i=e=>{if(e=parseInt(e,10),isNaN(e)||e<=0)throw new TypeError("Invalid interval. Expecting positive non-zero number of milliseconds.");s=e};i(s);const c=((n=undefined,s=null)=>{const r=t=>e(s?.persist)&&s.persist(t);let o=(()=>{const e=new Map,t=t=>(e.has(t)||e.set(t,new Set),e.get(t)),n=(e,n)=>{if("function"!=typeof n)throw new TypeError("Expecting callback function as second argument");return t(e).add(n),()=>t(e).delete(n)};return{publish:(e,n={})=>{t(e).forEach((e=>e(n)))},subscribe:n,subscribeOnce:(e,t)=>{const s=n(e,(e=>{t(e),s()}));return s},unsubscribeAll:t=>e.delete(t)}})(),i=n;r(i);const c=()=>i,u=e=>{i!==e&&(i=e,r(i),o.publish("change",i))};return{set:u,get:c,update:e=>{t(e,"[update]"),u(e(c()))},subscribe:e=>(t(e,"[subscribe]"),e(i),o.subscribe("change",e))}})(0);let u=0,a=0;const l=()=>{const e=n();a||=e,c.set(e);const t=e-a,r=t?t-s:0,i=Math.max(0,s-r);u=setTimeout(l,i),((...e)=>{"function"==typeof o&&o.apply(null,e)})({_start:e,_duration:t,_offset:r,_nextInterval:i}),a=n()},p={subscribe:c.subscribe,start:()=>(!u&&l(),p),stop:()=>(c.set(0),u&&(clearTimeout(u),u=0),a=0,p),setInterval:e=>(i(e),p)};return r&&p.start(),p};
