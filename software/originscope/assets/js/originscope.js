/* OriginScope portable evidence engine — browser-local, no uploads in Browser mode. */
(() => {
  'use strict';
  const EPS = 1e-9;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const state = { model:null, samples:[], current:null, currentResult:null, mode:'browser', token:null, tokenExpiresAt:0, gpuHealth:null, gpuBase:null, gpuPractice:null };

  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:0;
  const std=a=>{const m=mean(a);return Math.sqrt(mean(a.map(v=>(v-m)*(v-m))))};
  const skew=a=>{const m=mean(a),s=std(a);return s<EPS?0:mean(a.map(v=>Math.pow((v-m)/s,3)))};
  const kurt=a=>{const m=mean(a),s=std(a);return s<EPS?0:mean(a.map(v=>Math.pow((v-m)/s,4)))};
  const quantile=(arr,p)=>{if(!arr.length)return 0;const a=[...arr].sort((x,y)=>x-y);const i=(a.length-1)*p/100,l=Math.floor(i),h=Math.ceil(i);return l===h?a[l]:a[l]*(h-i)+a[h]*(i-l)};
  const entropy=(arr,bins=32,lo=0,hi=1)=>{const h=new Array(bins).fill(0);for(const v0 of arr){const v=clamp(v0,lo,hi);let i=Math.floor((v-lo)/(hi-lo+EPS)*bins);i=clamp(i,0,bins-1);h[i]++}const n=arr.length||1;let e=0;for(const c of h)if(c){const p=c/n;e-=p*Math.log2(p)}return e};
  const corr=(a,b)=>{const ma=mean(a),mb=mean(b),sa=std(a),sb=std(b);if(sa<EPS||sb<EPS)return 0;let s=0;for(let i=0;i<a.length;i++)s+=(a[i]-ma)*(b[i]-mb);return s/(a.length*sa*sb)};
  const sigmoid=x=>1/(1+Math.exp(-clamp(x,-30,30)));

  function boxBlur(a,w,h,r){
    const out=new Float64Array(w*h), iw=w+1, ih=h+1, integral=new Float64Array(iw*ih);
    for(let y=0;y<h;y++){
      let row=0;for(let x=0;x<w;x++){row+=a[y*w+x];integral[(y+1)*iw+x+1]=integral[y*iw+x+1]+row;}
    }
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const x0=Math.max(0,x-r),x1=Math.min(w-1,x+r),y0=Math.max(0,y-r),y1=Math.min(h-1,y+r);
      const s=integral[(y1+1)*iw+x1+1]-integral[y0*iw+x1+1]-integral[(y1+1)*iw+x0]+integral[y0*iw+x0];
      out[y*w+x]=s/((x1-x0+1)*(y1-y0+1));
    }
    return out;
  }
  function residual(a,w,h,r){const b=boxBlur(a,w,h,r),o=new Float64Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]-b[i];return o;}
  function arrAbs(a){return Array.from(a,v=>Math.abs(v));}

  async function imageToArrays(blob,size=128){
    const bmp=await createImageBitmap(blob); const c=document.createElement('canvas');c.width=size;c.height=size;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(bmp,0,0,size,size);
    const d=ctx.getImageData(0,0,size,size).data,n=size*size,R=new Float64Array(n),G=new Float64Array(n),B=new Float64Array(n),gray=new Float64Array(n),sat=new Float64Array(n);
    for(let i=0,j=0;i<n;i++,j+=4){const r=d[j]/255,g=d[j+1]/255,b=d[j+2]/255;R[i]=r;G[i]=g;B[i]=b;gray[i]=.299*r+.587*g+.114*b;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);sat[i]=(mx-mn)/(mx+EPS)}
    return {R,G,B,gray,sat,w:size,h:size,bitmap:bmp};
  }

  function portableFeatures(A){
    const {R,G,B,gray,sat,w,h}=A,f={}; const sets=[['r',R],['g',G],['b',B]];
    for(const [nm,x0] of sets){const x=Array.from(x0);f[`g_${nm}_mean`]=mean(x);f[`g_${nm}_std`]=std(x);f[`g_${nm}_skew`]=skew(x);f[`g_${nm}_kurt`]=kurt(x)}
    f.g_gray_mean=mean(Array.from(gray));f.g_gray_std=std(Array.from(gray));f.g_gray_entropy=entropy(Array.from(gray),32,0,1);f.g_sat_mean=mean(Array.from(sat));f.g_sat_std=std(Array.from(sat));
    // central-difference gradient
    const gm=[],ang=[]; for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const gx=(gray[y*w+x+1]-gray[y*w+x-1])*.5,gy=(gray[(y+1)*w+x]-gray[(y-1)*w+x])*.5,g=Math.hypot(gx,gy);gm.push(g);ang.push((Math.atan2(gy,gx)+Math.PI)%Math.PI)}
    f.s_grad_mean=mean(gm);f.s_grad_std=std(gm);for(const p of [50,75,90,95])f[`s_grad_q${p}`]=quantile(gm,p);for(const t of [.02,.05,.1,.2])f[`s_edge_${t}`]=gm.filter(v=>v>t).length/(gm.length||1);
    const hist=new Array(8).fill(0);for(let i=0;i<gm.length;i++){let b=Math.floor(ang[i]/Math.PI*8);b=clamp(b,0,7);hist[b]+=gm[i]}const hs=hist.reduce((a,b)=>a+b,0)+EPS,ph=hist.map(v=>v/hs);ph.forEach((v,i)=>f[`s_orient_${i}`]=v);f.s_orient_entropy=-ph.filter(v=>v>0).reduce((s,v)=>s+v*Math.log2(v),0);f.s_orient_max=Math.max(...ph);
    const q75=quantile(gm,75);let hv=0,strong=0;for(let i=0;i<gm.length;i++)if(gm[i]>q75){strong++;const deg=ang[i]*180/Math.PI;if(deg<12||deg>168||(deg>78&&deg<102))hv++}f.s_hv_frac=strong?hv/strong:0;
    const lap=[];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=y*w+x;lap.push(gray[i-w]+gray[i+w]+gray[i-1]+gray[i+1]-4*gray[i])}const alap=lap.map(Math.abs);f.s_lap_std=std(lap);f.s_lap_absmean=mean(alap);f.s_lap_q90=quantile(alap,90);f.s_lap_q95=quantile(alap,95);
    const r1=residual(gray,w,h,1),r2=residual(gray,w,h,2);for(const [nm,rr] of [['r1',r1],['r2',r2]]){const a=Array.from(rr),aa=a.map(Math.abs);f[`t_${nm}_std`]=std(a);f[`t_${nm}_skew`]=skew(a);f[`t_${nm}_kurt`]=kurt(a);f[`t_${nm}_ent`]=entropy(a.map(v=>clamp(v,-.25,.25)),41,-.25,.25);for(const p of [50,75,90,95,99])f[`t_${nm}_aq${p}`]=quantile(aa,p)}
    const bs=8,means=[],vars=[],grads=[];for(let by=0;by<h;by+=bs)for(let bx=0;bx<w;bx+=bs){const p=[],rr=[],gg=[];for(let y=by;y<Math.min(h,by+bs);y++)for(let x=bx;x<Math.min(w,bx+bs);x++){const i=y*w+x;p.push(gray[i]);rr.push(r1[i]);if(y>0&&y<h-1&&x>0&&x<w-1){const gx=(gray[i+1]-gray[i-1])*.5,gy=(gray[i+w]-gray[i-w])*.5;gg.push(Math.hypot(gx,gy))}}means.push(mean(p));vars.push(Math.pow(std(rr),2));grads.push(mean(gg))}
    f.p_mean_std=std(means);f.p_resvar_mean=mean(vars);f.p_resvar_cv=std(vars)/(mean(vars)+EPS);f.p_grad_cv=std(grads)/(mean(grads)+EPS);
    const idx=[...grads.keys()].sort((a,b)=>grads[a]-grads[b]).slice(0,Math.floor(grads.length/2)),xm=idx.map(i=>means[i]),yv=idx.map(i=>vars[i]),mx=mean(xm),my=mean(yv);let cov=0,vx=0;for(let i=0;i<xm.length;i++){cov+=(xm[i]-mx)*(yv[i]-my);vx+=(xm[i]-mx)*(xm[i]-mx)}f.c_noise_slope=cov/(vx+EPS);
    const cres={};for(const [nm,ch] of sets){cres[nm]=residual(ch,w,h,1);f[`c_${nm}_resstd`]=std(Array.from(cres[nm]))}f.c_corr_rg=corr(Array.from(cres.r),Array.from(cres.g));f.c_corr_rb=corr(Array.from(cres.r),Array.from(cres.b));f.c_corr_gb=corr(Array.from(cres.g),Array.from(cres.b));
    const pv=[];for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const a=[];for(let y=dy;y<h;y+=2)for(let x=dx;x<w;x+=2)a.push(r1[y*w+x]);pv.push(Math.pow(std(a),2))}f.c_cfa_phase_cv=std(pv)/(mean(pv)+EPS);f.c_cfa_phase_range=(Math.max(...pv)-Math.min(...pv))/(mean(pv)+EPS);
    const Cb=new Float64Array(gray.length),Cr=new Float64Array(gray.length);for(let i=0;i<gray.length;i++){Cb[i]=(B[i]-gray[i])*.564+.5;Cr[i]=(R[i]-gray[i])*.713+.5}const hy=std(Array.from(residual(gray,w,h,1))),hcb=std(Array.from(residual(Cb,w,h,1))),hcr=std(Array.from(residual(Cr,w,h,1)));f.c_hf_y=hy;f.c_hf_cb=hcb;f.c_hf_cr=hcr;f.c_hf_cb_y=hcb/(hy+EPS);f.c_hf_cr_y=hcr/(hy+EPS);
    const mu=boxBlur(gray,w,h,1),sq=new Float64Array(gray.length);for(let i=0;i<gray.length;i++)sq[i]=gray[i]*gray[i];const ex2=boxBlur(sq,w,h,1),m=new Float64Array(gray.length);for(let i=0;i<gray.length;i++){const sig=Math.sqrt(Math.max(ex2[i]-mu[i]*mu[i],0));m[i]=(gray[i]-mu[i])/(sig+1/255)}const mv=Array.from(m);f.n_m_mean=mean(mv);f.n_m_std=std(mv);f.n_m_skew=skew(mv);f.n_m_kurt=kurt(mv);f.n_m_ent=entropy(mv.map(v=>clamp(v,-4,4)),51,-4,4);for(const p of [5,25,50,75,95])f[`n_m_q${p}`]=quantile(mv,p);
    const pairs={h:[],v:[],d1:[],d2:[]};for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;if(x<w-1)pairs.h.push(m[i]*m[i+1]);if(y<h-1)pairs.v.push(m[i]*m[i+w]);if(x<w-1&&y<h-1)pairs.d1.push(m[i]*m[i+w+1]);if(x>0&&y<h-1)pairs.d2.push(m[i]*m[i+w-1])}for(const [nm,z] of Object.entries(pairs)){f[`n_${nm}_mean`]=mean(z);f[`n_${nm}_std`]=std(z);f[`n_${nm}_skew`]=skew(z);f[`n_${nm}_kurt`]=kurt(z);f[`n_${nm}_neg`]=z.filter(v=>v<0).length/(z.length||1)}
    return f;
  }

  function classifyPortable(features){
    const m=state.model;let raw=m.intercept;for(let i=0;i<m.selected_features.length;i++){const n=m.selected_features[i],z=((features[n]??0)-m.mean[i])/(m.scale[i]||1);raw+=m.coef[i]*z}const p=sigmoid(m.calibrator_coef*raw+m.calibrator_intercept);
    const route=routePortable(features,m.router);return {raw,ai:p,camera:1-p,route};
  }
  function routePortable(features,r){
    const x=r.features.map((n,i)=>((features[n]??0)-r.mean[i])/(r.scale[i]||1));const pair=[];for(let k=0;k<r.coef.length;k++){let s=r.intercept[k];for(let i=0;i<x.length;i++)s+=r.coef[k][i]*x[i];pair.push(s)}
    // sklearn OVO voting for 3 classes: pairs 0v1,0v2,1v2
    const votes=[0,0,0];let p=0;for(let i=0;i<r.classes.length;i++)for(let j=i+1;j<r.classes.length;j++){if(pair[p++]>0)votes[j]++;else votes[i]++}return r.classes[votes.indexOf(Math.max(...votes))];
  }

  async function parseMetadata(blob){
    const buf=await blob.arrayBuffer(),bytes=new Uint8Array(buf);let ascii='';const limit=Math.min(bytes.length,2_000_000);for(let i=0;i<limit;i++)ascii+=String.fromCharCode(bytes[i]);const low=ascii.toLowerCase();const out={present:false,camera_make:null,camera_model:null,software:null,datetime:null,iso:null,exposure_time:null,f_number:null,focal_length:null,gps_present:false,c2pa_marker_present:low.includes('c2pa')||low.includes('jumbf')||low.includes('content credentials'),note:'Unsigned metadata is supporting evidence, not proof of origin.'};
    try{const ex=parseExifBasic(new DataView(buf));Object.assign(out,ex);out.present=Object.values(ex).some(v=>v!==null&&v!==false)}catch(_){/* no EXIF */}
    const sw=(out.software||'').toLowerCase();out.ai_software_hint=['stable diffusion','midjourney','dall-e','dalle','firefly','comfyui','automatic1111','flux','openai'].some(x=>sw.includes(x));out.editing_software_hint=['photoshop','lightroom','gimp','affinity','snapseed'].some(x=>sw.includes(x));return out;
  }
  function parseExifBasic(v){
    const out={camera_make:null,camera_model:null,software:null,datetime:null,iso:null,exposure_time:null,f_number:null,focal_length:null,gps_present:false};if(v.getUint16(0)!==0xFFD8)return out;let off=2;
    while(off+4<v.byteLength){if(v.getUint8(off)!==0xFF){off++;continue}const marker=v.getUint8(off+1),len=v.getUint16(off+2);if(marker===0xE1&&off+2+len<=v.byteLength){let s='';for(let i=off+4;i<Math.min(off+10,v.byteLength);i++)s+=String.fromCharCode(v.getUint8(i));if(s.startsWith('Exif')){parseTiff(v,off+10,out);return out}}off+=2+len}return out;
  }
  function parseTiff(v,tiff,out){const le=v.getUint16(tiff)===0x4949,U16=o=>v.getUint16(o,le),U32=o=>v.getUint32(o,le);if(U16(tiff+2)!==42)return;const first=tiff+U32(tiff+4);let exifPtr=null,gpsPtr=null;
    const readVal=(entry)=>{const tag=U16(entry),type=U16(entry+2),count=U32(entry+4),sizes={1:1,2:1,3:2,4:4,5:8,7:1,9:4,10:8},n=(sizes[type]||1)*count,pos=n<=4?entry+8:tiff+U32(entry+8);if(pos<0||pos+n>v.byteLength)return null;if(type===2){let s='';for(let i=0;i<count-1&&pos+i<v.byteLength;i++)s+=String.fromCharCode(v.getUint8(pos+i));return s.trim()||null}if(type===3)return U16(pos);if(type===4)return U32(pos);if(type===5){const den=U32(pos+4);return den?U32(pos)/den:null}return null};
    const parseIFD=(at,sub=false)=>{if(at+2>v.byteLength)return;const n=U16(at);for(let i=0;i<n;i++){const e=at+2+i*12;if(e+12>v.byteLength)break;const tag=U16(e),val=readVal(e);if(!sub){if(tag===0x010F)out.camera_make=val;if(tag===0x0110)out.camera_model=val;if(tag===0x0131)out.software=val;if(tag===0x0132)out.datetime=val;if(tag===0x8769)exifPtr=tiff+U32(e+8);if(tag===0x8825)gpsPtr=tiff+U32(e+8)}else{if(tag===0x8827)out.iso=val;if(tag===0x829A)out.exposure_time=val;if(tag===0x829D)out.f_number=val;if(tag===0x9003)out.datetime=val||out.datetime;if(tag===0x920A)out.focal_length=val}}};parseIFD(first,false);if(exifPtr)parseIFD(exifPtr,true);out.gps_present=!!gpsPtr;}

  function confidence(p){const d=Math.abs(p-.5)*2;return d>=.6?'High':d>=.28?'Moderate':'Low'}
  function evidenceFrom(features,meta,res){const ev=[];ev.push(`Portable pixel model routed this image to the ${res.route} evidence regime.`);if(res.ai>=.5){ev.push('High-frequency and natural-image statistics lean toward synthetic generation.');if(features.c_hf_y<.02)ev.push('Fine-scale luminance residual energy is unusually low for many camera pipelines.')}else{ev.push('Local residual and natural-image statistics are more compatible with camera-origin imagery.');if(features.c_hf_y>.02)ev.push('Fine-scale luminance residual energy provides camera-process support.')}
    if(meta.ai_software_hint)ev.push('Software metadata contains an AI-generation hint; metadata is supporting evidence only.');else if(meta.camera_make||meta.camera_model)ev.push('Camera make/model metadata is present, but unsigned EXIF can be forged or removed.');else ev.push('No useful camera metadata was found; absence of EXIF does not imply AI generation.');if(meta.c2pa_marker_present)ev.push('A possible C2PA/JUMBF marker is present; browser mode cannot cryptographically validate it.');return ev;}

  async function sha256Hex(blob){try{const buf=await blob.arrayBuffer();const digest=await crypto.subtle.digest('SHA-256',buf);return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('')}catch(_){return null}}
  async function analyzeBlob(blob,filename='image'){
    if(!blob || !blob.type?.startsWith('image/')){toast('Choose a JPG, PNG, or WebP image.','warn');return null}
    state.current={blob,filename};showAnalysisState();
    if(state.mode==='gpu') return analyzeGPU(blob,filename);
    const [A,meta,sha]=await Promise.all([imageToArrays(blob,128),parseMetadata(blob),sha256Hex(blob)]);meta.sha256=sha;meta.file_size_bytes=blob.size;meta.format=(blob.type||'image').replace('image/','').toUpperCase();setStep(1,true);
    const f=portableFeatures(A);setStep(2,true);setStep(3,true);const r=classifyPortable(f);setStep(4,true);
    const result={schema_version:'1.1-portable',engine:'OriginScope Portable Evidence Model',decision_basis:'portable browser-local pixel model',classification:r.ai>=.5?'AI':'REAL',verdict:r.ai>=.5?'Likely AI-generated':'Likely camera-origin',confidence:confidence(r.ai),probabilities:{ai_generated:r.ai,camera_origin:r.camera},evidence_scores:{synthetic_generation:r.ai,physical_capture:r.camera,metadata_support:(meta.camera_make||meta.camera_model)?0.7:(meta.ai_software_hint?0.15:0.45)},content_regime:r.route,metadata:meta,provenance:{state:meta.c2pa_marker_present?'marker_present_not_validated':meta.present?'unsigned_metadata_only':'no_provenance_evidence_found',c2pa:{status:'not_checked',validated:false,tool_available:false,marker_present:meta.c2pa_marker_present,summary:'Browser mode can detect possible C2PA/JUMBF bytes but does not perform cryptographic C2PA validation.'},unsigned_metadata_present:!!meta.present},gpu_reconstruction_evidence:{status:'not_requested',used_in_verdict:false},evidence:evidenceFrom(f,meta,r),limitations:['Portable browser mode is a lightweight research model and has lower measured accuracy than the full forensic engine.','The verdict is probabilistic forensic inference, not proof of authorship or factual truth.','Unsigned EXIF is never treated as definitive proof.','Possible C2PA bytes are not equivalent to a validated Content Credentials signature.','Localized manipulation is not separately classified in this release.'],benchmark_context:state.model.metrics};
    setStep(5,true);renderResult(result,blob,filename);return result;
  }

  function gpuBase(){return (state.gpuBase||window.ORIGINSCOPE_CONNECTOR_BASE||'http://127.0.0.1:8765').replace(/\/$/,'')}
  function connectorConnected(){return !!state.gpuHealth?.state?.connected || state.gpuHealth?.connected===true}

  async function checkGPUHealth(showToast=false){
    const status=$('#gpu-status'),txt=$('#gpu-status-text'),btn=$('#gpu-connect');
    status.dataset.state='checking';txt.textContent=`Checking local connector…`;
    try{
      const r=await fetch(`${gpuBase()}/v1/health`,{method:'GET',mode:'cors',cache:'no-store',signal:AbortSignal.timeout?AbortSignal.timeout(2500):undefined});
      if(!r.ok)throw new Error(`HTTP ${r.status}`);const h=await r.json();state.gpuHealth=h;const st=h.state||{};const rh=st.remote_health||{};const g=rh.gpu||{};const n=rh.dataset?.n_images||0;
      if(st.connected){status.dataset.state='online';txt.textContent=`SSH GPU connected · ${g.gpu_name||g.device||st.host||'Ubuntu server'}${n?` · ${n.toLocaleString()} practice images`:''}`;btn.textContent='Connected';}
      else if(['connecting','deploying','starting'].includes(st.phase)){status.dataset.state='checking';txt.textContent=`${st.message||'Preparing GPU…'} ${st.progress||0}%`;btn.textContent='Preparing…';}
      else{status.dataset.state='locked';txt.textContent='Local connector ready · GPU not authenticated';btn.textContent='Connect GPU';}
      $('#gpu-practice-count').textContent=n?`${n.toLocaleString()} indexed server images`:'Connect GPU to use server dataset';syncMode();return true;
    }catch(e){state.gpuHealth=null;status.dataset.state='offline';txt.textContent='Local connector not detected on this computer';btn.textContent='Connector help';$('#gpu-practice-count').textContent='Browser mode works without connector';if(showToast)toast('GPU mode needs the one-time OriginScope Local Connector. Browser mode remains fully available.','warn');return false}
  }

  async function prefillGPUFields(host, port, user){
    const apply=data=>{if(!data||typeof data!=='object')return; if(data.host && !host.value)host.value=String(data.host); if(data.port && !port.value)port.value=String(data.port); if(data.username && !user.value)user.value=String(data.username);};
    try{const last=JSON.parse(localStorage.getItem('originscope.gpu.defaults')||'null');apply(last)}catch(_){}
    try{const r=await fetch(`${gpuBase()}/v1/defaults`,{cache:'no-store'}); if(r.ok)apply(await r.json());}
    catch(_){}
    if(!port.value)port.value='22';
  }

  function loginDialog(){
    return new Promise((resolve,reject)=>{const dlg=$('#gpu-dialog'),form=$('#gpu-login-form'),pass=$('#gpu-password'),err=$('#gpu-login-error'),close=$('#gpu-dialog-close'),host=$('#gpu-host'),port=$('#gpu-port'),user=$('#gpu-user'),trustWrap=$('#gpu-trust-wrap'),trust=$('#gpu-trust'),fp=$('#gpu-fingerprint'),progress=$('#gpu-connect-progress');err.hidden=true;progress.hidden=true;trustWrap.hidden=true;pass.value='';let settled=false;prefillGPUFields(host,port,user);
      const cleanup=()=>{form.removeEventListener('submit',submit);close.removeEventListener('click',cancel);dlg.removeEventListener('cancel',cancel)};
      const cancel=e=>{if(e)e.preventDefault();if(!settled){settled=true;cleanup();if(dlg.open)dlg.close();reject(new Error('GPU connection cancelled.'))}};
      const poll=async()=>{for(let i=0;i<900;i++){await new Promise(r=>setTimeout(r,1000));let r;try{r=await fetch(`${gpuBase()}/v1/status`,{cache:'no-store'});}catch(_){continue}const st=await r.json();progress.hidden=false;progress.textContent=`${st.message||st.phase} ${st.progress||0}%`;if(st.connected){state.gpuHealth={...(state.gpuHealth||{}),state:st};await checkGPUHealth();return true}if(st.phase==='error')throw new Error(st.error||'GPU connection failed.')}throw new Error('GPU preparation timed out.')};
      const submit=async e=>{e.preventDefault();err.hidden=true;$('#gpu-login-submit').disabled=true;try{const body={host:host.value.trim(),port:Number(port.value||22),username:user.value.trim(),password:pass.value,trust_host_key:!!trust.checked,auto_deploy:true};if(!body.host||!body.username||!body.password)throw new Error('Server, username and SSH password are required.');try{localStorage.setItem('originscope.gpu.defaults',JSON.stringify({host:body.host,port:body.port,username:body.username}))}catch(_){ }let r=await fetch(`${gpuBase()}/v1/connect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data=await r.json().catch(()=>({}));if(r.status===409 && data.detail?.code==='host_key_untrusted'){fp.textContent=data.detail.fingerprint||'Unknown fingerprint';trustWrap.hidden=false;throw new Error('First connection: confirm the SSH host fingerprint, check “Trust this server”, then connect again.')}if(!r.ok)throw new Error(typeof data.detail==='string'?data.detail:(data.detail?.message||`Connection failed (${r.status})`));pass.value='';await poll();settled=true;cleanup();dlg.close();resolve(true)}catch(ex){err.textContent=ex.message;err.hidden=false}finally{$('#gpu-login-submit').disabled=false}};
      form.addEventListener('submit',submit);close.addEventListener('click',cancel);dlg.addEventListener('cancel',cancel);dlg.showModal();setTimeout(()=>pass.focus(),50);
    })
  }
  async function ensureGPUAuth(){const connector=await checkGPUHealth(false);if(!connector){$('#gpu-dialog-copy').textContent='GPU mode needs the OriginScope Local Connector on this computer. Install it once; after that, SSH authentication happens entirely in this website.';try{await loginDialog()}catch(_){return false};return connectorConnected()}if(connectorConnected())return true;try{await loginDialog();return connectorConnected()}catch(_){return false}}

  async function modeChoiceDialog(){
    const dlg=$('#mode-dialog');if(!dlg)return;const status=$('#mode-choice-status'),browser=$('#choose-browser'),gpuBtn=$('#choose-gpu');
    if(state.gpuHealth)status.textContent=connectorConnected()?'Local connector + SSH GPU are ready.':'Local connector detected. GPU credentials will be requested in the next step.';else status.textContent='Browser mode needs nothing. GPU mode requires the optional local connector.';
    return new Promise(resolve=>{const chooseBrowser=()=>{state.mode='browser';try{sessionStorage.setItem('originscope.mode.chosen','browser')}catch(_){};cleanup();dlg.close();syncMode();resolve('browser')};const chooseGPU=async()=>{state.mode='gpu';try{sessionStorage.setItem('originscope.mode.chosen','gpu')}catch(_){};cleanup();dlg.close();syncMode();const ok=await ensureGPUAuth();if(!ok)toast('GPU mode is selected but not connected. Browser mode remains available.','warn');resolve('gpu')};const cleanup=()=>{browser.removeEventListener('click',chooseBrowser);gpuBtn.removeEventListener('click',chooseGPU)};browser.addEventListener('click',chooseBrowser);gpuBtn.addEventListener('click',chooseGPU);dlg.showModal()});
  }

  async function analyzeGPU(blob,filename){
    if(!await ensureGPUAuth()){hideAnalysisState();toast('GPU analysis was not run. Choose Browser mode or connect your authorized GPU server.','warn');return null}
    try{setStep(1,true);const fd=new FormData();fd.append('file',blob,filename);const r=await fetch(`${gpuBase()}/v1/analyze`,{method:'POST',body:fd});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.detail||`GPU connector ${r.status}`);setStep(2,true);setStep(3,true);setStep(4,true);setStep(5,true);renderResult(data,blob,filename);return data}catch(e){hideAnalysisState();toast(`Full forensic analysis failed: ${e.message}`,'warn');await checkGPUHealth(false);return null}
  }

  function showAnalysisState(){const p=$('#analysis-progress');p.hidden=false;$('#results').hidden=true;$$('[data-step]').forEach(x=>x.classList.remove('done'));}
  function hideAnalysisState(){$('#analysis-progress').hidden=true}
  function setStep(n,done){const x=$(`[data-step="${n}"]`);if(x&&done)x.classList.add('done')}
  function pct(v){return `${Math.round(clamp(Number(v)||0,0,1)*100)}%`}
  function provenanceText(r){const p=r.provenance||{},c=p.c2pa||{};if(c.validated)return ['Cryptographic provenance validated',c.manifest_summary||c.summary||'A C2PA manifest passed validation.'];if(c.status==='checked_not_validated')return ['No validated C2PA provenance',c.summary||'C2PA was checked but no validated provenance result was established.'];if(c.marker_present)return ['Possible provenance marker, not validated',c.summary||'C2PA/JUMBF-like bytes are present, but a marker alone is not proof.'];if(p.state==='unsigned_metadata_only')return ['Unsigned metadata only','EXIF/XMP may describe origin, but unsigned metadata can be changed or removed.'];return ['No cryptographic provenance found','Pixel inference can still be performed, but provenance was not positively established.']}
  function gpuEvidenceText(g){if(!g||g.status==='not_requested')return ['Not requested','Use Full forensic GPU mode to add latent-autoencoder reconstruction measurements.'];if(g.status==='disabled')return ['GPU evidence disabled','Set ORIGINSCOPE_ENABLE_GPU_VAE=1 on the private server to enable it.'];if(g.status==='unavailable')return ['GPU evidence unavailable',g.error||g.note||'The main ProcessRoute verdict was still computed.'];if(g.status==='measured'){const dev=g.device||'GPU',fusion=g.used_in_verdict?'Validated GPU fusion used in this verdict.':'Research evidence only; not fused into the current verdict.';return [`Measured · ${dev}`,`VAE reconstruction MSE ${Number(g.reconstruction_mse).toExponential(2)} · HF error ${Number(g.high_frequency_error).toExponential(2)} · latent σ ${Number(g.latent_std).toFixed(3)}. ${fusion}`]}return [String(g.status||'Unknown'),g.note||'']}
  function renderResult(r,blob,filename){state.currentResult=r;hideAnalysisState();$('#results').hidden=false;const ai=Number(r.probabilities?.ai_generated??.5),real=Number(r.probabilities?.camera_origin??(1-ai)),isAI=r.classification==='AI';const badge=$('#verdict-badge');badge.textContent=isAI?'Synthetic likely':'Camera-origin likely';badge.dataset.kind=isAI?'ai':'real';$('#result-title').textContent=r.verdict||'Evidence result';$('#confidence-text').textContent=`${r.confidence||confidence(ai)} confidence · ${r.engine||'OriginScope'}`;$('#ai-score').textContent=pct(ai);$('#real-score').textContent=pct(real);$('#ai-bar').style.width=pct(ai);$('#real-bar').style.width=pct(real);$('#regime').textContent=(r.content_regime||'unknown').replace(/^./,c=>c.toUpperCase());const prev=$('#result-preview');if(prev.dataset.url)URL.revokeObjectURL(prev.dataset.url);const u=URL.createObjectURL(blob);prev.src=u;prev.dataset.url=u;$('#result-filename').textContent=filename;
    const ev=$('#evidence-list');ev.innerHTML='';for(const x of r.evidence||[]){const li=document.createElement('li');li.textContent=x;ev.append(li)}
    const meta=r.metadata||{};const mt=$('#metadata-table tbody');mt.innerHTML='';const camera=[meta.camera_make,meta.camera_model].filter(Boolean).join(' ')||'—';const rows=[['File',`${meta.format||blob.type?.replace('image/','').toUpperCase()||'Image'}${meta.width&&meta.height?` · ${meta.width}×${meta.height}`:''}`],['SHA-256',meta.sha256?`${meta.sha256.slice(0,18)}…`:'—'],['EXIF',meta.present?'Present':'Not found'],['Camera',camera],['Software',meta.software||'—'],['Date/time',meta.datetime||'—'],['ISO',meta.iso??'—'],['Exposure',meta.exposure_time??'—'],['Aperture',meta.f_number??'—'],['Focal length',meta.focal_length??'—'],['GPS',meta.gps_present?'Present':'Not found'],['C2PA marker',meta.c2pa_marker_present?'Possible marker detected':'Not detected']];for(const [a,b] of rows){const tr=document.createElement('tr');tr.innerHTML=`<th>${esc(a)}</th><td>${esc(String(b))}</td>`;mt.append(tr)}
    const [ps,pd]=provenanceText(r);$('#provenance-summary').textContent=ps;$('#provenance-detail').textContent=pd;const [gs,gd]=gpuEvidenceText(r.gpu_reconstruction_evidence);$('#gpu-result').textContent=gs;$('#gpu-result-detail').textContent=gd;
    const lim=$('#limitations');lim.innerHTML='';for(const x of r.limitations||[]){const li=document.createElement('li');li.textContent=x;lim.append(li)}
    $('#download-report').onclick=()=>downloadJSON({...r,file:{name:filename,size:blob.size,type:blob.type},generated_at:new Date().toISOString()},`originscope-${filename.replace(/[^a-z0-9._-]/gi,'-')}.json`);$('#results').scrollIntoView({behavior:'smooth',block:'start'});
  }
  const esc=s=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  function downloadJSON(obj,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(obj,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}

  function syncMode(){$$('[data-mode]').forEach(b=>{const on=b.dataset.mode===state.mode;b.setAttribute('aria-pressed',String(on));if(b.dataset.mode==='gpu'){const lock=$('.lock-dot',b);if(lock)lock.textContent=connectorConnected()?'Connected':'Private'}});$('#mode-note').textContent=state.mode==='browser'?'Private browser analysis · image stays on this device':connectorConnected()?'Full ProcessRoute + GPU evidence · encrypted over your authenticated SSH session':'Full forensic GPU selected · enter authorized SSH credentials in the website to connect';}
  function toast(msg,kind='info'){const t=$('#toast');t.textContent=msg;t.dataset.kind=kind;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,5600)}
  function setupUpload(){const dz=$('#dropzone'),input=$('#file-input');dz.addEventListener('click',()=>input.click());dz.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();input.click()}});input.addEventListener('change',()=>{const f=input.files[0];if(f)analyzeBlob(f,f.name)});['dragenter','dragover'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.add('drag')}));['dragleave','drop'].forEach(ev=>dz.addEventListener(ev,e=>{e.preventDefault();dz.classList.remove('drag')}));dz.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f?.type.startsWith('image/'))analyzeBlob(f,f.name);else toast('Drop a JPG, PNG, or WebP image.','warn')});document.addEventListener('paste',e=>{const f=[...(e.clipboardData?.files||[])].find(x=>x.type.startsWith('image/'));if(f)analyzeBlob(f,f.name||'pasted-image.png')});$$('[data-mode]').forEach(b=>b.onclick=async()=>{if(b.dataset.mode==='gpu'){state.mode='gpu';try{sessionStorage.setItem('originscope.mode.chosen','gpu')}catch(_){};syncMode();await ensureGPUAuth()}else{state.mode='browser';try{sessionStorage.setItem('originscope.mode.chosen','browser')}catch(_){};syncMode()}});$('#gpu-connect').onclick=async()=>{if(connectorConnected()){toast('GPU is already connected.','info');return}await ensureGPUAuth();syncMode()};}

  async function loadPractice(){const grid=$('#practice-grid');for(const s of state.samples){const card=document.createElement('article');card.className='sample-card';card.innerHTML=`<div class="sample-image-wrap"><img src="${s.file}" alt="Practice sample from the ${s.regime} regime" loading="lazy"></div><div class="sample-body"><div class="sample-kicker">${s.regime} · matched group ${s.group}</div><div class="sample-actions"><button class="btn btn-small run">Analyze</button><button class="btn btn-small btn-ghost reveal">Reveal label</button></div><div class="sample-label" hidden><strong>${s.label}</strong> · ${s.source}</div></div>`;grid.append(card);$('.run',card).onclick=async()=>{const resp=await fetch(s.file);const blob=await resp.blob();await analyzeBlob(blob,s.id+'.jpg')};$('.reveal',card).onclick=()=>{$('.sample-label',card).hidden=false};}}

  async function loadGPUPractice(){if(!await ensureGPUAuth())return;const domain=$('#practice-domain').value||'any',btn=$('#gpu-practice');btn.disabled=true;try{const r=await fetch(`${gpuBase()}/v1/practice/random?domain=${encodeURIComponent(domain)}`);const s=await r.json();if(!r.ok)throw new Error(s.detail||`API ${r.status}`);state.gpuPractice=s;const stage=$('#gpu-practice-stage');stage.hidden=false;stage.innerHTML=`<article class="sample-card"><div class="sample-image-wrap"><img src="${s.image_data_url}" alt="Random hidden-label benchmark practice sample"></div><div class="sample-body"><div class="sample-kicker">${esc(s.domain)} · server benchmark · label hidden</div><div class="sample-actions"><button class="btn btn-small run-gpu-sample">Analyze with ${state.mode==='gpu'?'full GPU':'current'} engine</button><button class="btn btn-small btn-ghost reveal-gpu-sample">Reveal label</button></div><div class="sample-label gpu-reveal" hidden></div></div></article>`;$('.run-gpu-sample',stage).onclick=async()=>{const blob=await fetch(s.image_data_url).then(x=>x.blob());await analyzeBlob(blob,`benchmark-${s.token}.jpg`)};$('.reveal-gpu-sample',stage).onclick=async()=>{const rr=await fetch(`${gpuBase()}/v1/practice/reveal/${encodeURIComponent(s.token)}`);const d=await rr.json();if(!rr.ok)throw new Error(d.detail||`API ${rr.status}`);const x=$('.gpu-reveal',stage);x.innerHTML=`<strong>${esc(d.label)}</strong> · ${esc(d.source)} · ${esc(d.filename)}`;x.hidden=false};stage.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){toast(`Practice sample unavailable: ${e.message}`,'warn')}finally{btn.disabled=false}}

  async function init(){try{state.gpuBase=gpuBase();[state.model,state.samples]=await Promise.all([fetch('assets/models/portable-model.json').then(r=>r.json()),fetch('assets/data/practice-samples.json').then(r=>r.json())]);setupUpload();syncMode();loadPractice();$('#gpu-practice').onclick=loadGPUPractice;$('#portable-ba').textContent=pct(state.model.metrics.balanced_accuracy);$('#portable-auc').textContent=state.model.metrics.auroc.toFixed(3);const full=await fetch('assets/data/full-metrics.json').then(r=>r.json());$('#full-ba').textContent=pct(full.balanced_accuracy);$('#full-route').textContent=pct(full.routing_accuracy);$('#ready').textContent='Ready';$('#ready').dataset.ready='true';await checkGPUHealth(false);let chosen=null;try{chosen=sessionStorage.getItem('originscope.mode.chosen')}catch(_){};if(chosen==='gpu'){state.mode='gpu';syncMode();if(!connectorConnected())await ensureGPUAuth()}else if(chosen==='browser'){state.mode='browser';syncMode()}else{await modeChoiceDialog()}}catch(e){console.error(e);toast('OriginScope model assets could not be loaded. Serve the folder over HTTP rather than opening index.html directly.','warn')}}

  document.addEventListener('DOMContentLoaded',init);
})();
