const e=e=>"function"==typeof e,t=(t,n="")=>{if(!e(t))throw new TypeError(`${n} Expecting function arg`.trim())},n=(n=1e3)=>{if(n=parseInt(n,10),isNaN(n)||n<0)throw new TypeError("Invalid interval. Expecting positive non-zero number of milliseconds.");const s=((n=undefined,s=null)=>{const r=t=>e(s?.persist)&&s.persist(t);let i=(()=>{const e=new Map,t=t=>(e.has(t)||e.set(t,new Set),e.get(t)),n=(e,n)=>{if("function"!=typeof n)throw new TypeError("Expecting callback function as second argument");return t(e).add(n),()=>t(e).delete(n)};return{publish:(e,n={})=>{t(e).forEach((e=>e(n)))},subscribe:n,subscribeOnce:(e,t)=>{const s=n(e,(e=>{t(e),s()}));return s},unsubscribeAll:t=>e.delete(t)}})(),c=n;r(c);const o=()=>c,u=e=>{c!==e&&(c=e,r(c),i.publish("change",c))};return{set:u,get:o,update:e=>{t(e,"[update]"),u(e(o()))},subscribe:e=>(t(e,"[subscribe]"),e(c),i.subscribe("change",e))}})(0);let r=0;const i=()=>{s.set(Date.now()),r=setTimeout(i,n)},c={subscribe:s.subscribe,start:()=>(!r&&i(),c),stop:()=>(s.set(0),r&&(clearTimeout(r),r=0),c)};return c};export{n as createTicker};
