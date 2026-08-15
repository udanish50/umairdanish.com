import { test, expect } from '@playwright/test';
const enabled=process.env.VISUAL_BASELINES==='1';
const cases=[
 {name:'home-phone',route:'/',viewport:{width:390,height:844}},
 {name:'home-desktop',route:'/',viewport:{width:1440,height:900}},
 {name:'publications-phone',route:'/publications.html',viewport:{width:390,height:844}},
 {name:'software-desktop',route:'/software.html',viewport:{width:1440,height:900}},
];
for(const c of cases){
 test(c.name,async({page})=>{test.skip(!enabled,'Run with VISUAL_BASELINES=1');await page.setViewportSize(c.viewport);await page.route('**/*',r=>{const u=new URL(r.request().url());return ['127.0.0.1','localhost'].includes(u.hostname)?r.continue():r.abort()});await page.goto(c.route,{waitUntil:'domcontentloaded'});await expect(page).toHaveScreenshot(`${c.name}.png`,{fullPage:true,animations:'disabled',maxDiffPixelRatio:.01});});
}
