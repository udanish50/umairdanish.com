import { test, expect } from '@playwright/test';

const representativeRoutes=[
  '/',
  '/research.html',
  '/publications.html',
  '/software/core-norm/',
  '/software/linear-lens/',
  '/software/openmetriclab/',
  '/tools/',
];

async function isolateExternalNetwork(page){
  await page.route('**/*',route=>{
    const u=new URL(route.request().url());
    if(['127.0.0.1','localhost'].includes(u.hostname)||['data:','blob:'].includes(u.protocol)) return route.continue();
    return route.abort();
  });
}

async function clearPreference(page){
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
    localStorage.removeItem('ud-appearance');
    localStorage.removeItem('theme');
  });
}

test('System is the first-visit default and follows the OS',async({browser})=>{
  const context=await browser.newContext({viewport:{width:1280,height:800},colorScheme:'dark'});
  const page=await context.newPage();
  await isolateExternalNetwork(page);
  await page.goto('/',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{localStorage.removeItem('ud-appearance');localStorage.removeItem('theme')});
  await page.reload({waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.themeMode)).toBe('system');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.theme)).toBe('dark');
  await context.close();
});

test('Homepage has exactly one visible appearance control and no legacy moon toggle',async({page})=>{
  await isolateExternalNetwork(page);
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(()=>{
    const visible=el=>{
      if(!el)return false;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
    };
    const triggers=[...document.querySelectorAll('.v282-appearance-trigger')].filter(visible);
    const old=[...document.querySelectorAll('.hc-theme-toggle')].filter(visible);
    const desktop=document.querySelector('.v282-appearance--home-desktop');
    const chevron=desktop?.querySelector('.v282-trigger-chevron');
    const icon=desktop?.querySelector('.v282-trigger-icon svg');
    const cr=chevron?.getBoundingClientRect();
    const ir=icon?.getBoundingClientRect();
    return {
      triggers:triggers.length,
      oldVisible:old.length,
      legacyInDom:document.querySelectorAll('.hc-theme-toggle').length,
      chevronDisplay:chevron?getComputedStyle(chevron).display:null,
      chevronWidth:cr?Math.round(cr.width):0,
      chevronHeight:cr?Math.round(cr.height):0,
      iconWidth:ir?Math.round(ir.width):0,
      iconHeight:ir?Math.round(ir.height):0
    };
  });
  expect(report.triggers).toBe(1);
  expect(report.oldVisible).toBe(0);
  expect(report.legacyInDom).toBe(0);
  expect(report.chevronDisplay).toBe('none');
  expect(report.chevronWidth).toBe(0);
  expect(report.chevronHeight).toBe(0);
  expect(report.iconWidth).toBeLessThanOrEqual(24);
  expect(report.iconHeight).toBeLessThanOrEqual(24);
});

test('Appearance control is before Collaborate on desktop homepage',async({page})=>{
  await isolateExternalNetwork(page);
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(()=>{
    const actions=document.querySelector('.hc-header-actions');
    const control=actions?.querySelector('.v282-appearance--home-desktop');
    const collaborate=actions?.querySelector('.hc-header-collab');
    return {
      control:!!control,
      collaborate:!!collaborate,
      before:!!(control&&collaborate&&(control.compareDocumentPosition(collaborate)&Node.DOCUMENT_POSITION_FOLLOWING))
    };
  });
  expect(report).toEqual({control:true,collaborate:true,before:true});
});

test('Homepage mobile selector lives inside navigation',async({page})=>{
  await isolateExternalNetwork(page);
  await page.setViewportSize({width:390,height:844});
  await page.goto('/',{waitUntil:'domcontentloaded'});

  // The selector is intentionally inside the collapsed mobile navigation,
  // so test it in the same user-visible state a visitor reaches.
  const menuToggle=page.locator('.hc-menu-toggle');
  await menuToggle.click();
  await expect(menuToggle).toHaveAttribute('aria-expanded','true');

  const control=page.locator('.hc-nav .v282-appearance--home-mobile');
  await expect(control).toBeVisible();
  const trigger=control.locator('.v282-appearance-trigger');
  await expect(trigger).toBeVisible();
  const box=await trigger.boundingBox();
  expect(box).not.toBeNull();
  expect(box.height).toBeGreaterThanOrEqual(40);
});

test('Homepage header fits tablet landscape with appearance control',async({page})=>{
  await isolateExternalNetwork(page);
  await page.setViewportSize({width:1024,height:768});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const report=await page.evaluate(()=>({
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    actionsRight:Math.round(document.querySelector('.hc-header-actions')?.getBoundingClientRect().right||0),
    viewport:document.documentElement.clientWidth
  }));
  expect(report.overflow).toBeLessThanOrEqual(2);
  expect(report.actionsRight).toBeLessThanOrEqual(report.viewport);
});

test('Night preference persists across reload',async({page})=>{
  await isolateExternalNetwork(page);
  await page.setViewportSize({width:1440,height:900});
  await clearPreference(page);
  await page.reload({waitUntil:'domcontentloaded'});
  const trigger=page.locator('.v282-appearance--home-desktop .v282-appearance-trigger');
  await trigger.click();
  await page.locator('.v282-appearance--home-desktop [data-theme-choice="night"]').click();
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('ud-appearance'))).toBe('night');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.theme)).toBe('night');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.themeMode)).toBe('night');
  await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.theme)).toBe('night');
});

for(const mode of ['light','dark','night']){
  test.describe(`${mode} representative reflow`,()=>{
    for(const route of representativeRoutes){
      test(`${route} has no page overflow`,async({page})=>{
        await isolateExternalNetwork(page);
        await page.setViewportSize({width:390,height:844});
        await page.goto(route,{waitUntil:'domcontentloaded'});
        await page.evaluate(m=>localStorage.setItem('ud-appearance',m),mode);
        await page.reload({waitUntil:'domcontentloaded'});
        const report=await page.evaluate(()=>({
          mode:document.documentElement.dataset.themeMode,
          theme:document.documentElement.dataset.theme,
          overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
          bodyOverflow:document.body.scrollWidth-document.body.clientWidth
        }));
        expect(report.mode).toBe(mode);
        expect(report.theme).toBe(mode);
        expect(report.overflow).toBeLessThanOrEqual(2);
        expect(report.bodyOverflow).toBeLessThanOrEqual(2);
      });
    }
  });
}
