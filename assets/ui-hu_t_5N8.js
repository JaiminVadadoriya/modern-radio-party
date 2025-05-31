import{r as u,R as w}from"./vendor-CGaIVTnh.js";let U={data:""},V=e=>typeof window=="object"?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||U,q=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,B=/\/\*[^]*?\*\/|  +/g,I=/\n+/g,h=(e,t)=>{let r="",i="",s="";for(let a in e){let n=e[a];a[0]=="@"?a[1]=="i"?r=a+" "+n+";":i+=a[1]=="f"?h(n,a):a+"{"+h(n,a[1]=="k"?"":t)+"}":typeof n=="object"?i+=h(n,t?t.replace(/([^,])+/g,o=>a.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,l=>/&/.test(l)?l.replace(/&/g,o):o?o+" "+l:l)):a):n!=null&&(a=/^--/.test(a)?a:a.replace(/[A-Z]/g,"-$&").toLowerCase(),s+=h.p?h.p(a,n):a+":"+n+";")}return r+(t&&s?t+"{"+s+"}":s)+i},y={},M=e=>{if(typeof e=="object"){let t="";for(let r in e)t+=r+M(e[r]);return t}return e},G=(e,t,r,i,s)=>{let a=M(e),n=y[a]||(y[a]=(l=>{let c=0,d=11;for(;c<l.length;)d=101*d+l.charCodeAt(c++)>>>0;return"go"+d})(a));if(!y[n]){let l=a!==e?e:(c=>{let d,m,f=[{}];for(;d=q.exec(c.replace(B,""));)d[4]?f.shift():d[3]?(m=d[3].replace(I," ").trim(),f.unshift(f[0][m]=f[0][m]||{})):f[0][d[1]]=d[2].replace(I," ").trim();return f[0]})(e);y[n]=h(s?{["@keyframes "+n]:l}:l,r?"":"."+n)}let o=r&&y.g?y.g:null;return r&&(y.g=y[n]),((l,c,d,m)=>{m?c.data=c.data.replace(m,l):c.data.indexOf(l)===-1&&(c.data=d?l+c.data:c.data+l)})(y[n],t,i,o),n},K=(e,t,r)=>e.reduce((i,s,a)=>{let n=t[a];if(n&&n.call){let o=n(r),l=o&&o.props&&o.props.className||/^go/.test(o)&&o;n=l?"."+l:o&&typeof o=="object"?o.props?"":h(o,""):o===!1?"":o}return i+s+(n??"")},"");function z(e){let t=this||{},r=e.call?e(t.p):e;return G(r.unshift?r.raw?K(r,[].slice.call(arguments,1),t.p):r.reduce((i,s)=>Object.assign(i,s&&s.call?s(t.p):s),{}):r,V(t.target),t.g,t.o,t.k)}let F,_,k;z.bind({g:1});let b=z.bind({k:1});function Y(e,t,r,i){h.p=t,F=e,_=r,k=i}function v(e,t){let r=this||{};return function(){let i=arguments;function s(a,n){let o=Object.assign({},a),l=o.className||s.className;r.p=Object.assign({theme:_&&_()},o),r.o=/ *go\d+/.test(l),o.className=z.apply(r,i)+(l?" "+l:"");let c=e;return e[0]&&(c=o.as||e,delete o.as),k&&c[0]&&k(o),F(c,o)}return s}}var Z=e=>typeof e=="function",D=(e,t)=>Z(e)?e(t):e,J=(()=>{let e=0;return()=>(++e).toString()})(),H=(()=>{let e;return()=>{if(e===void 0&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),X=20,L=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,X)};case 1:return{...e,toasts:e.toasts.map(a=>a.id===t.toast.id?{...a,...t.toast}:a)};case 2:let{toast:r}=t;return L(e,{type:e.toasts.find(a=>a.id===r.id)?1:0,toast:r});case 3:let{toastId:i}=t;return{...e,toasts:e.toasts.map(a=>a.id===i||i===void 0?{...a,dismissed:!0,visible:!1}:a)};case 4:return t.toastId===void 0?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(a=>a.id!==t.toastId)};case 5:return{...e,pausedAt:t.time};case 6:let s=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(a=>({...a,pauseDuration:a.pauseDuration+s}))}}},$=[],x={toasts:[],pausedAt:void 0},O=e=>{x=L(x,e),$.forEach(t=>{t(x)})},Q={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},ee=(e={})=>{let[t,r]=u.useState(x),i=u.useRef(x);u.useEffect(()=>(i.current!==x&&r(x),$.push(r),()=>{let a=$.indexOf(r);a>-1&&$.splice(a,1)}),[]);let s=t.toasts.map(a=>{var n,o,l;return{...e,...e[a.type],...a,removeDelay:a.removeDelay||((n=e[a.type])==null?void 0:n.removeDelay)||(e==null?void 0:e.removeDelay),duration:a.duration||((o=e[a.type])==null?void 0:o.duration)||(e==null?void 0:e.duration)||Q[a.type],style:{...e.style,...(l=e[a.type])==null?void 0:l.style,...a.style}}});return{...t,toasts:s}},te=(e,t="blank",r)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...r,id:(r==null?void 0:r.id)||J()}),j=e=>(t,r)=>{let i=te(t,e,r);return O({type:2,toast:i}),i.id},p=(e,t)=>j("blank")(e,t);p.error=j("error");p.success=j("success");p.loading=j("loading");p.custom=j("custom");p.dismiss=e=>{O({type:3,toastId:e})};p.remove=e=>O({type:4,toastId:e});p.promise=(e,t,r)=>{let i=p.loading(t.loading,{...r,...r==null?void 0:r.loading});return typeof e=="function"&&(e=e()),e.then(s=>{let a=t.success?D(t.success,s):void 0;return a?p.success(a,{id:i,...r,...r==null?void 0:r.success}):p.dismiss(i),s}).catch(s=>{let a=t.error?D(t.error,s):void 0;a?p.error(a,{id:i,...r,...r==null?void 0:r.error}):p.dismiss(i)}),e};var re=(e,t)=>{O({type:1,toast:{id:e,height:t}})},ae=()=>{O({type:5,time:Date.now()})},E=new Map,ie=1e3,oe=(e,t=ie)=>{if(E.has(e))return;let r=setTimeout(()=>{E.delete(e),O({type:4,toastId:e})},t);E.set(e,r)},se=e=>{let{toasts:t,pausedAt:r}=ee(e);u.useEffect(()=>{if(r)return;let a=Date.now(),n=t.map(o=>{if(o.duration===1/0)return;let l=(o.duration||0)+o.pauseDuration-(a-o.createdAt);if(l<0){o.visible&&p.dismiss(o.id);return}return setTimeout(()=>p.dismiss(o.id),l)});return()=>{n.forEach(o=>o&&clearTimeout(o))}},[t,r]);let i=u.useCallback(()=>{r&&O({type:6,time:Date.now()})},[r]),s=u.useCallback((a,n)=>{let{reverseOrder:o=!1,gutter:l=8,defaultPosition:c}=n||{},d=t.filter(g=>(g.position||c)===(a.position||c)&&g.height),m=d.findIndex(g=>g.id===a.id),f=d.filter((g,S)=>S<m&&g.visible).length;return d.filter(g=>g.visible).slice(...o?[f+1]:[0,f]).reduce((g,S)=>g+(S.height||0)+l,0)},[t]);return u.useEffect(()=>{t.forEach(a=>{if(a.dismissed)oe(a.id,a.removeDelay);else{let n=E.get(a.id);n&&(clearTimeout(n),E.delete(a.id))}})},[t]),{toasts:t,handlers:{updateHeight:re,startPause:ae,endPause:i,calculateOffset:s}}},ne=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,le=b`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ce=b`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,ue=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ne} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${le} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${ce} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,de=b`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,pe=v("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${de} 1s linear infinite;
`,fe=b`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,me=b`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,ge=v("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${fe} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${me} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,ye=v("div")`
  position: absolute;
`,be=v("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,he=b`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ve=v("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${he} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,xe=({toast:e})=>{let{icon:t,type:r,iconTheme:i}=e;return t!==void 0?typeof t=="string"?u.createElement(ve,null,t):t:r==="blank"?null:u.createElement(be,null,u.createElement(pe,{...i}),r!=="loading"&&u.createElement(ye,null,r==="error"?u.createElement(ue,{...i}):u.createElement(ge,{...i})))},we=e=>`
0% {transform: translate3d(0,${e*-200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Oe=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e*-150}%,-1px) scale(.6); opacity:0;}
`,Ee="0%{opacity:0;} 100%{opacity:1;}",je="0%{opacity:1;} 100%{opacity:0;}",Pe=v("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,$e=v("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,De=(e,t)=>{let r=e.includes("top")?1:-1,[i,s]=H()?[Ee,je]:[we(r),Oe(r)];return{animation:t?`${b(i)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${b(s)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},Ce=u.memo(({toast:e,position:t,style:r,children:i})=>{let s=e.height?De(e.position||t||"top-center",e.visible):{opacity:0},a=u.createElement(xe,{toast:e}),n=u.createElement($e,{...e.ariaProps},D(e.message,e));return u.createElement(Pe,{className:e.className,style:{...s,...r,...e.style}},typeof i=="function"?i({icon:a,message:n}):u.createElement(u.Fragment,null,a,n))});Y(u.createElement);var Ne=({id:e,className:t,style:r,onHeightUpdate:i,children:s})=>{let a=u.useCallback(n=>{if(n){let o=()=>{let l=n.getBoundingClientRect().height;i(e,l)};o(),new MutationObserver(o).observe(n,{subtree:!0,childList:!0,characterData:!0})}},[e,i]);return u.createElement("div",{ref:a,className:t,style:r},s)},ze=(e,t)=>{let r=e.includes("top"),i=r?{top:0}:{bottom:0},s=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:H()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(r?1:-1)}px)`,...i,...s}},Se=z`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,P=16,Le=({reverseOrder:e,position:t="top-center",toastOptions:r,gutter:i,children:s,containerStyle:a,containerClassName:n})=>{let{toasts:o,handlers:l}=se(r);return u.createElement("div",{id:"_rht_toaster",style:{position:"fixed",zIndex:9999,top:P,left:P,right:P,bottom:P,pointerEvents:"none",...a},className:n,onMouseEnter:l.startPause,onMouseLeave:l.endPause},o.map(c=>{let d=c.position||t,m=l.calculateOffset(c,{reverseOrder:e,gutter:i,defaultPosition:t}),f=ze(d,m);return u.createElement(Ne,{id:c.id,key:c.id,onHeightUpdate:l.updateHeight,className:c.visible?Se:"",style:f},c.type==="custom"?D(c.message,c):s?s(c):u.createElement(Ce,{toast:c,position:d}))}))},Re=p,R={color:void 0,size:void 0,className:void 0,style:void 0,attr:void 0},A=w.createContext&&w.createContext(R),_e=["attr","size","title"];function ke(e,t){if(e==null)return{};var r=Ie(e,t),i,s;if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(s=0;s<a.length;s++)i=a[s],!(t.indexOf(i)>=0)&&Object.prototype.propertyIsEnumerable.call(e,i)&&(r[i]=e[i])}return r}function Ie(e,t){if(e==null)return{};var r={};for(var i in e)if(Object.prototype.hasOwnProperty.call(e,i)){if(t.indexOf(i)>=0)continue;r[i]=e[i]}return r}function C(){return C=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var i in r)Object.prototype.hasOwnProperty.call(r,i)&&(e[i]=r[i])}return e},C.apply(this,arguments)}function T(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);t&&(i=i.filter(function(s){return Object.getOwnPropertyDescriptor(e,s).enumerable})),r.push.apply(r,i)}return r}function N(e){for(var t=1;t<arguments.length;t++){var r=arguments[t]!=null?arguments[t]:{};t%2?T(Object(r),!0).forEach(function(i){Ae(e,i,r[i])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):T(Object(r)).forEach(function(i){Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(r,i))})}return e}function Ae(e,t,r){return t=Te(t),t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function Te(e){var t=Me(e,"string");return typeof t=="symbol"?t:t+""}function Me(e,t){if(typeof e!="object"||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var i=r.call(e,t);if(typeof i!="object")return i;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function W(e){return e&&e.map((t,r)=>w.createElement(t.tag,N({key:r},t.attr),W(t.child)))}function We(e){return t=>w.createElement(Fe,C({attr:N({},e.attr)},t),W(e.child))}function Fe(e){var t=r=>{var{attr:i,size:s,title:a}=e,n=ke(e,_e),o=s||r.size||"1em",l;return r.className&&(l=r.className),e.className&&(l=(l?l+" ":"")+e.className),w.createElement("svg",C({stroke:"currentColor",fill:"currentColor",strokeWidth:"0"},r.attr,i,n,{className:l,style:N(N({color:e.color||r.color},r.style),e.style),height:o,width:o,xmlns:"http://www.w3.org/2000/svg"}),a&&w.createElement("title",null,a),e.children)};return A!==void 0?w.createElement(A.Consumer,null,r=>t(r)):t(R)}export{We as G,Le as O,Re as V};
//# sourceMappingURL=ui-hu_t_5N8.js.map
