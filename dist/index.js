const t=t=>"function"==typeof t,e=(e,n="")=>{if(!t(e))throw new TypeError(`${n} Expecting function arg`.trim())},n=(n=void 0,s=null)=>{const r=e=>t(s?.persist)&&s.persist(e);let o=(()=>{const t=new Map,e=e=>(t.has(e)||t.set(e,new Set),t.get(e)),n=(t,n)=>{if("function"!=typeof n)throw new TypeError("Expecting callback function as second argument");return e(t).add(n),()=>e(t).delete(n)};return{publish:(t,n)=>{e(t).forEach((t=>t(n)))},subscribe:n,subscribeOnce:(t,e)=>{const s=n(t,(t=>{e(t),s()}));return s},unsubscribeAll:e=>t.delete(e)}})(),i=n;r(i);const c=()=>i,a=t=>{i!==t&&(i=t,r(i),o.publish("change",i))};return{set:a,get:c,update:t=>{e(t,"[update]"),a(t(c()))},subscribe:t=>(e(t,"[subscribe]"),t(i),o.subscribe("change",t))}},s=()=>"undefined"!=typeof window?window.performance.now():Date.now(),r=t=>{if(t=parseInt(t,10),Number.isNaN(t)||t<=0)throw new TypeError("Invalid interval. Expecting positive non-zero number of milliseconds.");return t},o=(t=1e3,e=!1,o=null)=>{const i=e=>t=r(e);i(t);const c=n(0);let a=0,u=0;const l=()=>{const e=s();u||=e,c.set(Date.now());const n=s()-u,r=n?n-t:0,i=Math.max(0,t-r);a=setTimeout(l,i),u=s(),((...t)=>{"function"==typeof o&&o.apply(null,t)})({_start:e,_duration:n,_offset:r,_nextInterval:i})},b={subscribe:c.subscribe,start:()=>(!a&&l(),b),stop:()=>(c.set(0),a&&(clearTimeout(a),a=0),u=0,b),setInterval:t=>(i(t),b)};return e&&b.start(),b},i=(t,e=1e3,s=!1)=>{const o=t=>e=r(t),i=(t={})=>({started:0,finished:0,error:null,result:null,...t||{}});o(e);const c=n(i());let a=0,u=s;const l=async()=>{if(!u)return;const n=Date.now();try{const e=c.get();c.set(i({started:n}));const s=await t(e);u&&c.set(i({started:n,finished:Date.now(),result:s}))}catch(t){u&&c.set(i({started:n,finished:Date.now(),error:t}))}u&&(a&&clearTimeout(a),a=setTimeout(l,e))},b={subscribe:c.subscribe,start:()=>(u=!0,!a&&l(),b),stop:()=>(a&&(clearTimeout(a),a=0),u=!1,b),setInterval:t=>(o(t),b)};return s&&b.start(),b};export{i as createDelayedWorkerTicker,o as createTicker};
