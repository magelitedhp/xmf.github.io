import{q as z,w as S,x as H,u as $,y as w,U as B,_ as M,z as P,E as T,R as j,T as A}from"./el-input-CG9u4s54.js";import{d as k,c as _,o as f,e as g,j as O,y as o,g as u,L as R,m as i,k as V,u as t,n as F,t as x,M as Z,O as q,P as L,_ as G,w as J,r as I,F as K,a as E,H as Q}from"./index-RFZI4gEj.js";const W=z({value:{type:[String,Number],default:""},max:{type:Number,default:99},isDot:Boolean,hidden:Boolean,type:{type:String,values:["primary","success","warning","info","danger"],default:"danger"},showZero:{type:Boolean,default:!0},color:String,dotStyle:{type:S([String,Object,Array])},badgeStyle:{type:S([String,Object,Array])},offset:{type:S(Array),default:[0,0]},dotClass:{type:String},badgeClass:{type:String}}),X=["textContent"],Y=k({name:"ElBadge"}),ee=k({...Y,props:W,setup(s,{expose:r}){const e=s,a=H("badge"),c=_(()=>e.isDot?"":$(e.value)&&$(e.max)?e.max<e.value?`${e.max}+`:e.value===0&&!e.showZero?"":`${e.value}`:`${e.value}`),y=_(()=>{var n,m,p,l,h,d;return[{backgroundColor:e.color,marginRight:w(-((m=(n=e.offset)==null?void 0:n[0])!=null?m:0)),marginTop:w((l=(p=e.offset)==null?void 0:p[1])!=null?l:0)},(h=e.dotStyle)!=null?h:{},(d=e.badgeStyle)!=null?d:{}]});return B({from:"dot-style",replacement:"badge-style",version:"2.8.0",scope:"el-badge",ref:"https://element-plus.org/en-US/component/badge.html"},_(()=>!!e.dotStyle)),B({from:"dot-class",replacement:"badge-class",version:"2.8.0",scope:"el-badge",ref:"https://element-plus.org/en-US/component/badge.html"},_(()=>!!e.dotClass)),r({content:c}),(n,m)=>(f(),g("div",{class:V(t(a).b())},[O(n.$slots,"default"),o(q,{name:`${t(a).namespace.value}-zoom-in-center`,persisted:""},{default:u(()=>[R(i("sup",{class:V([t(a).e("content"),t(a).em("content",n.type),t(a).is("fixed",!!n.$slots.default),t(a).is("dot",n.isDot),n.dotClass,n.badgeClass]),style:F(t(y)),textContent:x(t(c))},null,14,X),[[Z,!n.hidden&&(t(c)||n.isDot)]])]),_:1},8,["name"])],2))}});var te=M(ee,[["__file","badge.vue"]]);const ne=P(te),oe={viewBox:"0 0 1024 1024",width:"1.2em",height:"1.2em"},se=i("path",{fill:"currentColor",d:"M128 544h768a32 32 0 1 0 0-64H128a32 32 0 0 0 0 64"},null,-1),ae=[se];function le(s,r){return f(),g("svg",oe,[...ae])}const ue={name:"ep-minus",render:le},re={viewBox:"0 0 1024 1024",width:"1.2em",height:"1.2em"},ce=i("path",{fill:"currentColor",d:"M480 480V128a32 32 0 0 1 64 0v352h352a32 32 0 1 1 0 64H544v352a32 32 0 1 1-64 0V544H128a32 32 0 0 1 0-64z"},null,-1),ie=[ce];function de(s,r){return f(),g("svg",re,[...ie])}const me={name:"ep-plus",render:de},pe={viewBox:"0 0 1024 1024",width:"1.2em",height:"1.2em"},_e=i("path",{fill:"currentColor",d:"M512 512a192 192 0 1 0 0-384a192 192 0 0 0 0 384m0 64a256 256 0 1 1 0-512a256 256 0 0 1 0 512m320 320v-96a96 96 0 0 0-96-96H288a96 96 0 0 0-96 96v96a32 32 0 1 1-64 0v-96a160 160 0 0 1 160-160h448a160 160 0 0 1 160 160v96a32 32 0 1 1-64 0"},null,-1),fe=[_e];function ge(s,r){return f(),g("svg",pe,[...fe])}const he={name:"ep-user",render:ge},ve=L("count",{state:()=>({count:localStorage.getItem("count")*1}),getters:{doubleCount:s=>s.count*2},actions:{increment(s){this.count+=s*1,localStorage.setItem("count",this.count)},minus(s){this.count-=s*1,localStorage.setItem("count",this.count)},clear(){this.count=0,localStorage.setItem("count",this.count)}}}),ye={class:"card"},be={__name:"index",props:{msg:String},setup(s){const r=ve(),e=_(()=>r.count);J(()=>r.count,(p,l)=>{console.log(p,l,"?????????????")});const a=I(null),c=I(null),y=()=>{r.increment(a.value)},n=()=>{r.minus(c.value)},m=()=>{r.clear()};return(p,l)=>{const h=he,d=T,D=me,C=j,b=ne,N=ue,U=A;return f(),g(K,null,[i("h1",null,x(s.msg),1),i("div",ye,[i("button",{type:"button",onClick:l[0]||(l[0]=v=>e.value++)},"count is "+x(t(e)),1)]),o(b,{value:t(e)},{default:u(()=>[o(C,{modelValue:t(a),"onUpdate:modelValue":l[1]||(l[1]=v=>E(a)?a.value=v:null),style:{width:"120px"},placeholder:"increment"},{prefix:u(()=>[o(d,null,{default:u(()=>[o(h)]),_:1})]),suffix:u(()=>[o(d,{onClick:y},{default:u(()=>[o(D)]),_:1})]),_:1},8,["modelValue"])]),_:1},8,["value"]),o(b,{value:t(e)},{default:u(()=>[o(C,{modelValue:t(c),"onUpdate:modelValue":l[2]||(l[2]=v=>E(c)?c.value=v:null),style:{width:"120px"},placeholder:"minus"},{suffix:u(()=>[o(d,{onClick:n},{default:u(()=>[o(N)]),_:1})]),_:1},8,["modelValue"])]),_:1},8,["value"]),o(b,{value:t(e)},{default:u(()=>[o(U,{onClick:m},{default:u(()=>[Q("clear")]),_:1})]),_:1},8,["value"])],64)}}},Ce=G(be,[["__scopeId","data-v-a655c6be"]]);export{Ce as default};
