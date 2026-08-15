import { test, expect } from '@playwright/test';
import { discoverRoutes, canonicalViewports, fastViewports } from '../routes.mjs';
const routes=discoverRoutes();
const viewports=process.env.RESPONSIVE_FULL==='1'?canonicalViewports:fastViewports;

async function isolateExternalNetwork(page){
 await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)) return route.continue();
  return route.abort();
 });
}

for(const viewport of viewports){
 test.describe(viewport.name,()=>{
  test.use({viewport:{width:viewport.width,height:viewport.height}});
  for(const route of routes){
   test(`${route} reflows without page overflow`,async({page})=>{
    await isolateExternalNetwork(page);
    await page.goto(route,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>document.fonts?.ready).catch(()=>{});

    const report=await page.evaluate(()=>{
      const doc=document.documentElement,body=document.body;
      const viewportWidth=doc.clientWidth;
      const offenders=[];
      for(const el of document.querySelectorAll('body *')){
        const cs=getComputedStyle(el);
        if(cs.position==='fixed'||cs.position==='absolute') continue;
        if(cs.display==='none'||cs.visibility==='hidden') continue;
        const r=el.getBoundingClientRect();
        if(r.width>0 && (r.right>viewportWidth+2 || r.left<-2)){
          const parent=el.parentElement?getComputedStyle(el.parentElement):null;
          if(parent && ['auto','scroll'].includes(parent.overflowX)) continue;
          offenders.push({tag:el.tagName,cls:el.className?.toString().slice(0,90)||'',left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width)});
          if(offenders.length>=8) break;
        }
      }
      const bodyFont=parseFloat(getComputedStyle(body).fontSize);
      const h1=document.querySelector('h1');
      const h1Font=h1?parseFloat(getComputedStyle(h1).fontSize):null;
      return {
        docOverflow:doc.scrollWidth-doc.clientWidth,
        bodyOverflow:body.scrollWidth-body.clientWidth,
        bodyFont,h1Font,offenders,
        literalSlashN:(body.innerText||'').trimStart().startsWith('\\n'),
      };
    });

    expect(report.docOverflow,JSON.stringify(report.offenders,null,2)).toBeLessThanOrEqual(2);
    expect(report.bodyOverflow,JSON.stringify(report.offenders,null,2)).toBeLessThanOrEqual(2);
    expect(report.literalSlashN).toBe(false);
    expect(report.bodyFont).toBeGreaterThanOrEqual(14);
    expect(report.bodyFont).toBeLessThanOrEqual(18.5);
    if(report.h1Font!==null){
      expect(report.h1Font).toBeGreaterThanOrEqual(22);
      expect(report.h1Font).toBeLessThanOrEqual(66);
    }

    const badMedia=await page.evaluate(()=>[...document.querySelectorAll('img,video,canvas,svg')]
      .filter(el=>{const r=el.getBoundingClientRect();return r.width>document.documentElement.clientWidth+2})
      .slice(0,5).map(el=>({tag:el.tagName,cls:el.className?.toString()||'',width:Math.round(el.getBoundingClientRect().width)})));
    expect(badMedia,JSON.stringify(badMedia,null,2)).toEqual([]);

    if(viewport.width<=430){
      const undersized=await page.evaluate(()=>{
        const sel='button,.btn,.button,.hc-btn,.tool-button,.menu-toggle,.hc-menu-toggle,input[type="button"],input[type="submit"]';
        return [...document.querySelectorAll(sel)].filter(el=>{
          const cs=getComputedStyle(el); if(cs.display==='none'||cs.visibility==='hidden') return false;
          const r=el.getBoundingClientRect(); return r.width>0&&r.height>0&&r.height<40;
        }).slice(0,8).map(el=>({tag:el.tagName,cls:el.className?.toString()||'',height:Math.round(el.getBoundingClientRect().height)}));
      });
      expect(undersized,JSON.stringify(undersized,null,2)).toEqual([]);
    }
   });
  }
 });
}
