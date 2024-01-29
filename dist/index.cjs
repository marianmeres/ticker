"use strict";const e=e=>"function"==typeof e,t=(t,r="")=>{if(!e(t))throw new TypeError(`${r} Expecting function arg`.trim())},r=(r,n=null)=>{const s=t=>e(n?.persist)&&n.persist(t);let o=(()=>{const e=new Map,t=t=>(e.has(t)||e.set(t,new Set),e.get(t)),r=(e,r)=>{if("function"!=typeof r)throw new TypeError("Expecting callback function as second argument");return t(e).add(r),()=>t(e).delete(r)};return{publish:(e,r)=>{t(e).forEach((e=>e(r)))},subscribe:r,subscribeOnce:(e,t)=>{const n=r(e,(e=>{t(e),n()}));return n},unsubscribeAll:t=>e.delete(t)}})(),c=r;s(c);const i=()=>c,a=e=>{c!==e&&(c=e,s(c),o.publish("change",c))};return{set:a,get:i,update:e=>{t(e,"[update]"),a(e(i()))},subscribe:e=>(t(e,"[subscribe]"),e(c),o.subscribe("change",e))}},n=()=>"undefined"!=typeof window?window.performance.now():Date.now(),s=e=>{if(e=parseInt(e,10),Number.isNaN(e)||e<=0)throw new TypeError("Invalid interval. Expecting positive non-zero number of milliseconds.");return e};exports.createDelayedWorkerTicker=(e,t=1e3,n=!1)=>{const o=(e={})=>({started:0,finished:0,error:null,result:null,...e||{}});let c=0;const i=r(o());let a=0,u=n;const l=async()=>{if(!u)return;const r=Date.now();try{const t=i.get();i.set(o({started:r}));const n=await e(t);u&&i.set(o({started:r,finished:Date.now(),result:n}))}catch(e){u&&i.set(o({started:r,finished:Date.now(),error:e}))}if(u){a&&clearTimeout(a);const e=(n=c||0,s("function"==typeof t?t(n):t));a=setTimeout(l,e),c=e}var n},p={subscribe:i.subscribe,start:()=>(u=!0,!a&&l(),p),stop:()=>(a&&(clearTimeout(a),a=0),u=!1,c=0,p),setInterval:e=>(t=e,p)};return n&&p.start(),p},exports.createTicker=(e=1e3,t=!1,o=null)=>{const c=t=>s("function"==typeof e?e(t):e);let i=c(0);const a=r(0);let u=0,l=0;const p=()=>{const e=n();l||=e,a.set(Date.now());const t=n()-l,r=t?t-i:0,s=Math.max(0,c(i)-r);u=setTimeout(p,s),i=s,l=n(),((...e)=>{"function"==typeof o&&o.apply(null,e)})({_start:e,_duration:t,_offset:r,_nextInterval:s})},f={subscribe:a.subscribe,start:()=>(!u&&p(),f),stop:()=>(a.set(0),u&&(clearTimeout(u),u=0),l=0,i=0,f),setInterval:t=>(e=t,f)};return t&&f.start(),f};
