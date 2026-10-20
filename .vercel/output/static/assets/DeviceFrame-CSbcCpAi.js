import{j as t}from"./index-xhrgwNix.js";const w=`
.vg-screen{position:relative;display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;font-family:var(--brand-font-body);color:var(--brand-text);background:var(--brand-background);font-size:calc(11px * var(--vg-font-scale,1));line-height:1.4}
.vg-screen *{box-sizing:border-box}
.vg-row{display:flex;align-items:center}
.vg-col{display:flex;flex-direction:column}
.vg-between{justify-content:space-between}
.vg-center{align-items:center;justify-content:center}
.vg-gap2{gap:8px}.vg-gap3{gap:12px}.vg-gap4{gap:16px}
.vg-flex1{flex:1;min-width:0;min-height:0}
.vg-scroll{overflow:auto}
.vg-muted{color:var(--brand-muted-foreground)}
.vg-chip{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:9999px;background:var(--vg-chip-bg);color:var(--vg-chip-fg);font-size:calc(9px * var(--vg-font-scale,1));font-weight:700;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}
.vg-chip.soft{background:var(--brand-muted);color:var(--brand-muted-foreground)}
.vg-card{background:var(--brand-surface);border:1px solid var(--brand-border);border-radius:10px;padding:10px}
.vg-bar{height:7px;border-radius:9999px;background:var(--brand-muted);overflow:hidden}
.vg-bar>i{display:block;height:100%;background:linear-gradient(90deg,var(--brand-primary),var(--brand-gold-bright));border-radius:9999px}
.vg-avatar{width:22px;height:22px;border-radius:9999px;background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary),var(--brand-gold-deep));flex:none;box-shadow:inset 0 1px #fff6}
.vg-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:6px 11px;border-radius:8px;font-size:calc(10px * var(--vg-font-scale,1));font-weight:700;white-space:nowrap;border:0}
.vg-btn.pri{background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary) 30%,var(--brand-gold-deep));color:var(--brand-on-primary);box-shadow:inset 0 1px #fff6}
.vg-btn.out{border:1px solid var(--brand-border);color:var(--brand-text);background:transparent}
.vg-nav{height:34px;display:flex;align-items:center;gap:8px;padding:0 12px;border-bottom:1px solid var(--brand-border);background:var(--brand-surface);flex:none}
.vg-nav .logo{font-weight:900;font-size:calc(12px * var(--vg-font-scale,1));color:var(--brand-text);white-space:nowrap;display:inline-flex;align-items:center;gap:5px}
.vg-nav .logo b{color:var(--brand-primary)}
.vg-nav .logo img{display:block}
.vg-tab{padding:5px 9px;border-radius:8px;font-weight:600;color:var(--brand-muted-foreground);font-size:calc(10px * var(--vg-font-scale,1));white-space:nowrap}
.vg-tab.on{background:var(--brand-primary);color:var(--brand-on-primary)}
.vg-side{width:44px;border-right:1px solid var(--brand-border);background:var(--brand-surface);display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0;flex:none}
.vg-side .i{width:26px;height:26px;border-radius:8px;background:var(--brand-muted);display:flex;align-items:center;justify-content:center;color:var(--brand-muted-foreground);font-size:calc(12px * var(--vg-font-scale,1))}
.vg-side .i.on{background:var(--brand-primary);color:var(--brand-on-primary)}
.vg-table .h,.vg-table .r{display:grid;grid-template-columns:1.5fr 1fr .9fr .8fr;gap:6px;padding:6px 12px;font-size:calc(9px * var(--vg-font-scale,1));align-items:center}
.vg-table .h{color:var(--brand-muted-foreground);font-weight:700;border-bottom:1px solid var(--brand-border);text-transform:uppercase;letter-spacing:.04em}
.vg-table .r{border-bottom:1px solid var(--brand-border)}
.vg-table .r span:first-child{font-weight:700}
.vg-table .pill{display:inline-block;padding:2px 7px;border-radius:9999px;font-size:calc(8px * var(--vg-font-scale,1));font-weight:700;background:var(--vg-chip-bg);color:var(--vg-chip-fg)}
.vg-table .pill.soft{background:var(--brand-muted);color:var(--brand-muted-foreground)}
.vg-kpi{display:flex;flex-direction:column;gap:3px;padding:9px;border:1px solid var(--brand-border);border-radius:10px;background:var(--brand-surface)}
.vg-kpi .v{font-size:calc(15px * var(--vg-font-scale,1));font-weight:900;line-height:1}
.vg-kpi .l{font-size:calc(8px * var(--vg-font-scale,1));color:var(--brand-muted-foreground);text-transform:uppercase;letter-spacing:.04em}
.vg-chart{display:flex;align-items:flex-end;gap:5px;height:54px}
.vg-chart i{flex:1;background:linear-gradient(180deg,var(--brand-gold-bright),var(--brand-primary));border-radius:4px 4px 0 0}
.vg-kanban{display:flex;gap:7px;height:100%;padding:10px}
.vg-kanban .col{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}
.vg-kanban .col .head{font-size:calc(9px * var(--vg-font-scale,1));font-weight:700;color:var(--brand-muted-foreground);text-transform:uppercase;letter-spacing:.04em;display:flex;justify-content:space-between}
.vg-kanban .card{background:var(--brand-surface);border:1px solid var(--brand-border);border-radius:8px;padding:6px}
.vg-kanban .card .t{font-size:calc(9px * var(--vg-font-scale,1));font-weight:700}
.vg-kanban .card .m{font-size:calc(8px * var(--vg-font-scale,1));color:var(--brand-muted-foreground);margin-top:3px}
.vg-kanban .card .tag{display:inline-block;margin-top:5px;padding:2px 6px;border-radius:9999px;background:var(--vg-chip-bg);color:var(--vg-chip-fg);font-size:calc(7px * var(--vg-font-scale,1));font-weight:700}
.vg-feed .item{display:flex;gap:8px;padding:9px 12px;border-bottom:1px solid var(--brand-border)}
.vg-feed .thumb{width:38px;height:38px;border-radius:9px;background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary),var(--brand-gold-deep));flex:none}
.vg-feed .body{flex:1;min-width:0}
.vg-feed .ttl{font-size:calc(10px * var(--vg-font-scale,1));font-weight:700}
.vg-feed .meta{font-size:calc(8px * var(--vg-font-scale,1));color:var(--brand-muted-foreground);margin-top:1px}
.vg-feed .ln{height:6px;border-radius:9999px;background:var(--brand-muted);margin-top:5px}
.vg-tabbar{height:40px;display:flex;border-top:1px solid var(--brand-border);background:var(--brand-surface);flex:none}
.vg-tabbar .t{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--brand-muted-foreground)}
.vg-tabbar .t.on{color:var(--brand-primary)}
.vg-tabbar .t .d{width:15px;height:15px;border-radius:5px;background:currentColor;opacity:.45}
.vg-tabbar .t.on .d{opacity:1}
.vg-tabbar .t span{font-size:calc(7px * var(--vg-font-scale,1));font-weight:600}
.vg-search{padding:9px 12px;border-bottom:1px solid var(--brand-border);flex:none}
.vg-search .f{display:flex;align-items:center;gap:6px;padding:7px 11px;border:1px solid var(--brand-border);border-radius:9999px;background:var(--brand-muted)}
.vg-fab{position:absolute;right:12px;bottom:50px;width:36px;height:36px;border-radius:9999px;background:linear-gradient(135deg,var(--brand-gold-light),var(--brand-primary),var(--brand-gold-deep));box-shadow:inset 0 1px #fff6,0 3px 8px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;color:var(--brand-on-primary);font-size:calc(18px * var(--vg-font-scale,1));font-weight:900}
.vg-tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 12px 10px}
.vg-tiles .tile{padding:10px;border:1px solid var(--brand-border);border-radius:12px;background:var(--brand-surface);display:flex;flex-direction:column;gap:4px}
.vg-tiles .tile .v{font-size:calc(17px * var(--vg-font-scale,1));font-weight:900;line-height:1}
.vg-tiles .tile .l{font-size:calc(8px * var(--vg-font-scale,1));color:var(--brand-muted-foreground);text-transform:uppercase;letter-spacing:.04em}
.vg-tiles .tile .ic{width:22px;height:22px;border-radius:7px;background:rgba(0,89,255,.15);color:var(--brand-gold-deep);display:flex;align-items:center;justify-content:center;font-size:calc(11px * var(--vg-font-scale,1))}
.vg-flow{display:flex;flex-direction:column;gap:4px}
.vg-flow .step{display:flex;align-items:center;gap:9px;padding:5px 0}
.vg-flow .step .n{width:20px;height:20px;border-radius:9999px;background:var(--brand-muted);color:var(--brand-muted-foreground);display:flex;align-items:center;justify-content:center;font-size:calc(9px * var(--vg-font-scale,1));font-weight:800;flex:none}
.vg-flow .step.on .n{background:var(--brand-primary);color:var(--brand-on-primary)}
.vg-flow .step .t{font-size:calc(11px * var(--vg-font-scale,1));font-weight:600}
.vg-flow .step.on .t{color:var(--brand-primary)}
.vg-media{flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding:12px;color:#fff;background:linear-gradient(150deg,var(--brand-secondary),var(--brand-primary) 55%,var(--brand-gold-bright))}
.vg-media .progress{height:3px;background:#ffffff3b;border-radius:9999px;overflow:hidden;margin-bottom:10px}
.vg-media .progress i{display:block;height:100%;width:42%;background:#fff;border-radius:9999px}
.vg-media .overlay{display:flex;justify-content:space-between;align-items:flex-end;gap:10px}
.vg-media .actions{display:flex;flex-direction:column;gap:11px;align-items:center}
.vg-media .actions .a{width:28px;height:28px;border-radius:9999px;background:#ffffff26;display:flex;align-items:center;justify-content:center;font-size:calc(13px * var(--vg-font-scale,1));backdrop-filter:blur(2px)}
`,l={primaryColor:"#0059ff",secondaryColor:"#0d2f96",logoText:"Strategic Minds",heading:"Overview",subtitle:"Workspace summary",brandName:"Atlas Industries",themeMode:"light",fontColor:"",fontFamily:"Roboto",fontScale:1,logoImage:""},k=[{name:"Strategic Blue",primary:"#0059ff",secondary:"#0d2f96"},{name:"Emerald",primary:"#10b981",secondary:"#065f46"},{name:"Sunset",primary:"#f97316",secondary:"#9a3412"},{name:"Violet",primary:"#7c3aed",secondary:"#4c1d95"},{name:"Rose",primary:"#e11d48",secondary:"#881337"},{name:"Teal",primary:"#0d9488",secondary:"#134e4a"},{name:"Mono",primary:"#111827",secondary:"#000000"}],S=["Roboto","Inter","Poppins","Montserrat","Open Sans","Lato","Raleway","Nunito","Ubuntu","Playfair Display","Merriweather","Source Sans 3","Work Sans","DM Sans","Manrope","Rubik","Quicksand","Josefin Sans","Cabin","Barlow","Karla","Mulish","Heebo","Titillium Web","Fira Sans","Oswald","Archivo","Space Grotesk","Sora","Lexend","Plus Jakarta Sans"];function j(n){if(typeof document>"u")return;const r="vg-google-fonts",a=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(n).replace(/%20/g,"+")}:wght@400;500;700;900&display=swap`;let e=document.getElementById(r);e||(e=document.createElement("link"),e.id=r,e.rel="stylesheet",document.head.appendChild(e)),e.href=a}const x=n=>Math.max(0,Math.min(255,n));function g(n){let r=String(n||"#000000").replace("#","");r.length===3&&(r=r.split("").map(e=>e+e).join(""));const a=parseInt(r,16)||0;return{r:a>>16&255,g:a>>8&255,b:a&255}}function v(n,r,a){return"#"+[n,r,a].map(e=>x(Math.round(e)).toString(16).padStart(2,"0")).join("")}function f(n,r,a){const e=g(n);return v(e.r+(r-e.r)*a,e.g+(r-e.g)*a,e.b+(r-e.b)*a)}const i=(n,r)=>f(n,255,r),c=(n,r)=>f(n,0,r);function u(n,r){const a=g(n);return`rgba(${a.r},${a.g},${a.b},${r})`}function h(n){const r=g(n),a=[r.r,r.g,r.b].map(e=>(e/=255,e<=.03928?e/12.92:Math.pow((e+.055)/1.055,2.4)));return .2126*a[0]+.7152*a[1]+.0722*a[2]}function m(n){return h(n)>.5?"#0b1020":"#ffffff"}function z(n){const r={...l,...n},a=r.primaryColor,e=r.secondaryColor,d=r.themeMode==="dark",o={"--brand-primary":a,"--brand-accent":a,"--brand-gold-mid":a,"--brand-gold-bright":i(a,.15),"--brand-gold-light":i(a,.36),"--brand-gold-deep":c(a,.22),"--brand-secondary":e,"--brand-on-primary":m(a),"--vg-chip-bg":d?u(a,.22):i(a,.86),"--vg-chip-fg":d?i(a,.3):c(a,.2),"--brand-font-body":`'${r.fontFamily}', sans-serif`,"--brand-font-heading":`'${r.fontFamily}', sans-serif`,"--vg-font-scale":String(r.fontScale||1)};return d?(o["--brand-background"]="#0b1020",o["--brand-surface"]="#111827",o["--brand-text"]="#f8fafc",o["--brand-muted"]="#1f2937",o["--brand-muted-foreground"]="#94a3b8",o["--brand-border"]="#243044",o["--brand-card-subtle"]="#0f172a"):(o["--brand-background"]="#ffffff",o["--brand-surface"]="#ffffff",o["--brand-text"]="#14213d",o["--brand-muted"]="#f4f8ff",o["--brand-muted-foreground"]="#4b5563",o["--brand-border"]="#e2e8f0",o["--brand-card-subtle"]="#f7faff"),r.fontColor&&(o["--brand-text"]=r.fontColor),o}const b="vg.studio.config";function R(){try{const n=localStorage.getItem(b);return n?{...l,...JSON.parse(n)}:{...l}}catch{return{...l}}}function C(n){try{localStorage.setItem(b,JSON.stringify(n))}catch{}}function M({type:n,designW:r,designH:a,displayW:e,children:d}){const o=e/r,p=Math.round(a*o),s=t.jsx("div",{style:{width:e,height:p,overflow:"hidden",position:"relative"},children:t.jsx("div",{style:{width:r,height:a,transform:`scale(${o})`,transformOrigin:"top left"},children:d})});return n==="phone"?t.jsx("div",{style:{padding:6,background:"var(--brand-secondary)",borderRadius:20,boxShadow:"0 10px 24px rgba(13,47,150,.22)"},children:t.jsx("div",{style:{width:e,height:p,borderRadius:14,overflow:"hidden",position:"relative",background:"#fff",border:"1px solid rgba(0,0,0,.12)"},children:s})}):t.jsxs("div",{style:{width:e,borderRadius:12,overflow:"hidden",boxShadow:"0 10px 24px rgba(0,0,0,.12)",border:"1px solid #e2e8f0",background:"#fff"},children:[t.jsxs("div",{style:{height:22,background:"#f1f5f9",display:"flex",alignItems:"center",gap:5,padding:"0 9px",borderBottom:"1px solid #e2e8f0"},children:[t.jsx("span",{style:{width:7,height:7,borderRadius:9999,background:"#ef4444"}}),t.jsx("span",{style:{width:7,height:7,borderRadius:9999,background:"#f59e0b"}}),t.jsx("span",{style:{width:7,height:7,borderRadius:9999,background:"#22c55e"}}),t.jsx("div",{style:{flex:1}}),t.jsx("div",{style:{height:12,width:"46%",borderRadius:9999,background:"#fff",border:"1px solid #e2e8f0"}})]}),s]})}export{l as D,S as F,k as P,M as a,j as b,w as c,R as l,C as s,z as t};
