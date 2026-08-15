import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export const siteRoot=path.resolve(here,'../..');
function walk(dir){
 const out=[];
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(['.git','node_modules','quality'].includes(ent.name)) continue;
  const p=path.join(dir,ent.name);
  if(ent.isDirectory()) out.push(...walk(p)); else if(ent.isFile()&&ent.name.endsWith('.html')) out.push(p);
 }
 return out;
}
export function discoverRoutes(){
 const routes=[];
 for(const file of walk(siteRoot)){
  const text=fs.readFileSync(file,'utf8');
  if(!/<head\b/i.test(text)||!/<body\b/i.test(text)) continue;
  if(/<meta\b[^>]*http-equiv=["']refresh["']/i.test(text)) continue;
  const rel=path.relative(siteRoot,file).split(path.sep).join('/');
  if(rel==='index.html') routes.push('/');
  else if(rel.endsWith('/index.html')) routes.push('/'+rel.slice(0,-'index.html'.length));
  else routes.push('/'+rel);
 }
 return [...new Set(routes)].sort();
}
export const canonicalViewports=[
 {name:'phone-320',width:320,height:568},
 {name:'phone-360',width:360,height:800},
 {name:'phone-390',width:390,height:844},
 {name:'phone-430',width:430,height:932},
 {name:'tablet-768',width:768,height:1024},
 {name:'tablet-landscape-1024',width:1024,height:768},
 {name:'laptop-1280',width:1280,height:800},
 {name:'laptop-1366',width:1366,height:768},
 {name:'desktop-1440',width:1440,height:900},
 {name:'desktop-1920',width:1920,height:1080},
 {name:'wide-2560',width:2560,height:1440},
];
export const fastViewports=canonicalViewports.filter(v=>['phone-320','phone-390','tablet-768','tablet-landscape-1024','desktop-1440','desktop-1920'].includes(v.name));
