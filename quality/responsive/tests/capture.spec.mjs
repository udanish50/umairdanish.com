import { test } from '@playwright/test';
import fs from 'node:fs';import path from 'node:path';
import { canonicalViewports, siteRoot } from '../routes.mjs';
const routes=['/','/research.html','/publications.html','/software.html','/about.html','/contact.html','/software/openmetriclab/','/software/linear-lens/','/tools/'];
const views=canonicalViewports.filter(v=>['phone-390','tablet-768','desktop-1440','wide-2560'].includes(v.name));
for(const v of views){
 test.describe(v.name,()=>{test.use({viewport:{width:v.width,height:v.height}});for(const route of routes){
  test(`capture ${route}`,async({page})=>{await page.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)?r.continue():r.abort()});await page.goto(route,{waitUntil:'domcontentloaded'});const dir=path.join(siteRoot,'quality/responsive/artifacts',v.name);fs.mkdirSync(dir,{recursive:true});const name=(route==='/'?'home':route.replace(/^\//,'').replaceAll('/','-').replace(/\.html$/,'')||'page')+'.png';await page.screenshot({path:path.join(dir,name),fullPage:true,animations:'disabled'});});
 }});
}
