(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.DSAEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const CLASSES=['O(1)','O(log n)','O(n)','O(n log n)','O(n²)','O(n³)','O(2ⁿ)'];
const rank={'O(1)':0,'O(log n)':1,'O(n)':2,'O(n log n)':3,'O(n²)':4,'O(n³)':5,'O(2ⁿ)':6,'O(?)':7};
function stripStringsAndComments(code, language){
  let s=String(code||'');
  const lang=language||detectLanguage(s);
  s=s.replace(/'''[\s\S]*?'''|\"\"\"[\s\S]*?\"\"\"/g,' ');
  s=s.replace(/\/\*[\s\S]*?\*\//g,' ');
  // Python uses // for floor division, so only strip // comments for non-Python languages.
  if(!/^Python/.test(lang)) s=s.replace(/(^|[^:])\/\/.*$/gm,'$1');
  if(/^Python/.test(lang)) s=s.replace(/#.*$/gm,'');
  s=s.replace(/'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"/g,'STR');
  return s;
}
function detectLanguage(code){
  const s=String(code||'');
  if(/(^|\n)\s*def\s+\w+\s*\(|(^|\n)\s*(from\s+\w+\s+import|import\s+\w+)/m.test(s) && /:\s*(#.*)?$/m.test(s)) return 'Python';
  if(/\b(public|private|protected)\s+(static\s+)?(void|int|long|double|String)|System\.out|ArrayList<|HashMap</.test(s)) return 'Java';
  if(/#include\s*[<\"]|std::|cout\s*<</.test(s)) return 'C++';
  if(/\b(function\s+\w+|const\s+\w+\s*=\s*\(|let\s+\w+|console\.log|=>)/.test(s)) return 'JavaScript';
  if(/\bfor\s*\([^;]+;[^;]+;[^\)]+\)/.test(s)) return 'C-like';
  return 'Python-like';
}
function factor(kind){
  if(kind==='constant') return {p:0,l:0,e:false};
  if(kind==='log') return {p:0,l:1,e:false};
  if(kind==='nlogn') return {p:1,l:1,e:false};
  if(kind==='quadratic') return {p:2,l:0,e:false};
  if(kind==='cubic') return {p:3,l:0,e:false};
  if(kind==='exp') return {p:0,l:0,e:true};
  return {p:1,l:0,e:false};
}
function mul(a,b){ if(a.e||b.e)return {p:0,l:0,e:true}; return {p:a.p+b.p,l:a.l+b.l,e:false}; }
function maxF(a,b){ return scoreF(a)>=scoreF(b)?a:b; }
function scoreF(a){ return a.e?99:a.p*10+a.l; }
function formatF(a){
  if(a.e)return 'O(2ⁿ)';
  if(a.p===0&&a.l===0)return 'O(1)';
  if(a.p===0&&a.l===1)return 'O(log n)';
  if(a.p===1&&a.l===0)return 'O(n)';
  if(a.p===1&&a.l===1)return 'O(n log n)';
  if(a.p===2&&a.l===0)return 'O(n²)';
  if(a.p===3&&a.l===0)return 'O(n³)';
  if(a.p>3&&a.l===0)return `O(n^${a.p})`;
  if(a.l>1&&a.p===0)return `O(log^${a.l} n)`;
  return `O(n^${a.p}${a.l?` log${a.l>1?'^'+a.l:''} n`:''})`;
}
function isNumericBound(x){ return /^\s*-?\d+(?:\.\d+)?\s*$/.test(x||''); }
function classifyLoop(line, neighborhood){
  const s=line.trim();
  let m=s.match(/^for\s+\w+\s+in\s+range\(([^)]*)\)/);
  if(m){
    const args=m[1].split(',').map(x=>x.trim()).filter(Boolean);
    const bound=args.length>1?args[1]:args[0];
    const step=args.length>2?args[2]:'';
    if(isNumericBound(bound) && (!step||isNumericBound(step))) return {kind:'constant',why:'fixed numeric range'};
    return {kind:'linear',why:'range grows with input'};
  }
  m=s.match(/^for\s+.+\s+in\s+(.+):?$/);
  if(m){
    if(/^\s*(\[[^\]]*\]|\([^)]*\)|\{[^}]*\})\s*:??$/.test(m[1]) && !/\b\w+\b/.test(m[1].replace(/[\[\]\(\)\{\},:'\"0-9\s]/g,''))) return {kind:'constant',why:'fixed literal iterable'};
    return {kind:'linear',why:'iterates over an input-sized collection'};
  }
  m=s.match(/for\s*\(([^;]*);([^;]*);([^)]*)\)/);
  if(m){
    const cond=m[2], upd=m[3];
    if(/\*=\s*[2-9]|\/=\s*[2-9]|>>=|<<=/.test(upd)) return {kind:'log',why:'multiplicative loop update'};
    if(/<\s*\d+|<=\s*\d+|>\s*-?\d+/.test(cond) && !/[A-Za-z_]\w*/.test(cond.replace(/\b(for|int|long|size_t)\b/g,''))) return {kind:'constant',why:'fixed numeric loop bound'};
    return {kind:'linear',why:'additive loop update to input-dependent bound'};
  }
  if(/^while\b/.test(s)){
    const joined=neighborhood.join('\n');
    const vm=(s.match(/while\s*\(?\s*([A-Za-z_]\w*)/)||[])[1];
    if(vm){
      const re=new RegExp('\\b'+vm+'\\s*(?://=|/=|>>=|<<=|\\*=)\\s*[2-9]');
      if(re.test(joined)) return {kind:'log',why:`${vm} changes multiplicatively`};
      const re2=new RegExp('\\b'+vm+'\\s*(?:\\+=|-=)\\s*\\d+|\\b'+vm+'(?:\\+\\+|--)');
      if(re2.test(joined)) return {kind:'linear',why:`${vm} changes additively`};
    }
    if(/\b(?:low|lo)\s*<=?\s*(?:high|hi)\b|\b(?:high|hi)\s*>=?\s*(?:low|lo)\b/.test(s) && /(?:low|lo)\s*=.*mid|(?:high|hi)\s*=.*mid/.test(joined)) return {kind:'log',why:'binary-search interval halving'};
    return {kind:'linear',why:'input-dependent while loop (conservative)'};
  }
  return {kind:'linear',why:'loop'};
}
function analyzePythonBlocks(lines){
  const loops=[]; let active=[]; let max=factor('constant'); const evidence=[];
  for(let i=0;i<lines.length;i++){
    const raw=lines[i]; if(!raw.trim()) continue;
    const indent=(raw.match(/^[ \t]*/)||[''])[0].replace(/\t/g,'    ').length;
    active=active.filter(x=>indent>x.indent);
    const t=raw.trim();
    if(/^(for\b|while\b)/.test(t)){
      const cls=classifyLoop(t,lines.slice(i+1,i+9));
      const item={line:i+1,indent,kind:cls.kind,why:cls.why,text:t};
      active.push(item); loops.push(item);
      let prod=factor('constant'); for(const a of active) prod=mul(prod,factor(a.kind));
      max=maxF(max,prod); evidence.push(`Line ${i+1}: ${cls.why}.`);
    }
    if(/\b(?:sorted\s*\(|\.sort\s*\()/.test(t)){
      let prod=factor('nlogn'); for(const a of active) prod=mul(prod,factor(a.kind));
      max=maxF(max,prod); evidence.push(`Line ${i+1}: comparison sorting contributes O(n log n).`);
    }
  }
  return {loops,max,evidence};
}
function analyzeBraceBlocks(lines){
  let depth=0, active=[], max=factor('constant'); const loops=[], evidence=[];
  for(let i=0;i<lines.length;i++){
    let raw=lines[i], t=raw.trim();
    const closes=(raw.match(/}/g)||[]).length; if(closes){ depth=Math.max(0,depth-closes); active=active.filter(x=>depth>=x.depth); }
    if(/\b(for\s*\(|while\s*\()/.test(t)){
      const cls=classifyLoop(t,lines.slice(i+1,i+9));
      const item={line:i+1,depth:depth+1,kind:cls.kind,why:cls.why,text:t}; active.push(item); loops.push(item);
      let prod=factor('constant'); for(const a of active) prod=mul(prod,factor(a.kind)); max=maxF(max,prod);
      evidence.push(`Line ${i+1}: ${cls.why}.`);
    }
    if(/\b(?:Arrays\.sort|Collections\.sort|std::sort|\.sort\s*\()/.test(t)){
      let prod=factor('nlogn'); for(const a of active) prod=mul(prod,factor(a.kind)); max=maxF(max,prod);
      evidence.push(`Line ${i+1}: comparison sorting contributes O(n log n).`);
    }
    const opens=(raw.match(/{/g)||[]).length; depth+=opens;
    active=active.filter(x=>depth>=x.depth);
  }
  return {loops,max,evidence};
}
function recursiveComplexity(clean, lines, baseMax){
  const defs=[];
  for(const re of [/\bdef\s+([A-Za-z_]\w*)\s*\(/g,/\b(?:function\s+)?([A-Za-z_]\w*)\s*\([^)]*\)\s*\{/g]){
    let m; while((m=re.exec(clean))) defs.push(m[1]);
  }
  let out=baseMax, stack=factor('constant'), evidence=[];
  for(const name of new Set(defs)){
    const callRe=new RegExp('\\b'+name+'\\s*\\(','g'); const calls=[...clean.matchAll(callRe)].length-1; if(calls<=0) continue;
    const half=new RegExp(name+'\\s*\\([^)]*(?:\\/\\/?\\s*2|>>\\s*1)','g').test(clean);
    const minus1=new RegExp(name+'\\s*\\([^)]*(?:-\\s*1|-\\s*2)','g').test(clean);
    if(calls>=2 && minus1){ out=factor('exp'); stack=factor('linear'); evidence.push(`Recursive function ${name} branches on n-1/n-2: exponential recurrence pattern.`); }
    else if(calls>=2 && half){ const hasLinear=scoreF(baseMax)>=scoreF(factor('linear')); out=maxF(out,hasLinear?factor('nlogn'):factor('linear')); stack=factor('log'); evidence.push(`Recursive function ${name} makes multiple half-size calls.`); }
    else if(half){ out=maxF(out,factor('log')); stack=factor('log'); evidence.push(`Recursive function ${name} reduces problem size multiplicatively.`); }
    else if(minus1){ out=maxF(out,factor('linear')); stack=factor('linear'); evidence.push(`Recursive function ${name} reduces problem size additively.`); }
    else { evidence.push(`Recursion detected in ${name}; recurrence not fully resolved.`); }
  }
  return {time:out,stack,evidence};
}
function spaceComplexity(clean, recursionStack){
  let s=factor('constant'), why=[];
  if(/\[\s*\[[^\n]*for\b[^\n]*\]\s*for\b|new\s+\w+\s*\[\s*\w+\s*\]\s*\[\s*\w+\s*\]|\[\s*\w+\s*\]\s*\[\s*\w+\s*\]/.test(clean)){ s=factor('quadratic'); why.push('Input-sized 2D storage detected.'); }
  else if(/\b(?:list|set|dict|deque)\s*\(|\[[^\]]*for\b|\{[^}]*for\b|new\s+(?:int|long|double|String|boolean)\s*\[\s*[A-Za-z_]\w*\s*\]|ArrayList<|HashMap<|HashSet<|Queue<|Deque</.test(clean)){ s=factor('linear'); why.push('Input-sized container allocation detected.'); }
  s=maxF(s,recursionStack||factor('constant'));
  if(recursionStack && scoreF(recursionStack)>0) why.push(`Recursive call stack contributes ${formatF(recursionStack)} space.`);
  return {space:s,why};
}
function confidence(clean, loops, evidence){
  let c=.94;
  if(/\bwhile\b/.test(clean) && !/(\/=|\*=|>>=|<<=|\+=|-=|mid)/.test(clean)) c-=.12;
  if(/\b(eval|exec|reflection|metaprogram|yield from)\b/.test(clean)) c-=.2;
  if(/\brecursive|recursion\b/i.test(clean)) c-=.03;
  if(!loops.length && !/sort|\bdef\b|function\b/.test(clean)) c=.9;
  return Math.max(.55,Math.min(.99,c));
}
function analyzeCode(code, options={}){
  const original=String(code||''); const lang=options.language||detectLanguage(original); const clean=stripStringsAndComments(original,lang); const lines=clean.split(/\r?\n/);
  const block=(lang==='Python'||lang==='Python-like')?analyzePythonBlocks(lines):analyzeBraceBlocks(lines);
  const rec=recursiveComplexity(clean,lines,block.max); let time=rec.time;
  if(/\b(?:heapq\.(?:heappush|heappop)|PriorityQueue|priority_queue)\b/.test(clean) && block.loops.length){ time=maxF(time,factor('nlogn')); block.evidence.push('Heap operations inside an input-sized traversal contribute O(n log n).'); }
  if(/\b(?:set|dict|HashSet|HashMap)\b/.test(clean) && scoreF(time)<scoreF(factor('linear')) && block.loops.length) time=maxF(time,factor('linear'));
  // Python list comprehensions are loops even though they occupy one physical line.
  if(/\[[^\n]*\bfor\b[^\n]*\bfor\b/.test(clean)){ time=maxF(time,factor('quadratic')); block.evidence.push('Nested comprehension contributes O(n²).'); }
  else if(/\[[^\n]*\bfor\b/.test(clean) && scoreF(time)<scoreF(factor('linear'))){ time=maxF(time,factor('linear')); block.evidence.push('Comprehension contributes O(n).'); }
  // Front removal from a Python list shifts remaining elements: O(n) per dequeue.
  if(block.loops.length && /\.pop\s*\(\s*0\s*\)|remove\s*\(\s*0\s*\)/.test(clean)){ time=maxF(time,factor('quadratic')); block.evidence.push('Front removal from an array/list occurs inside a traversal, yielding O(n²) total work.'); }
  // Membership on a list/unknown sequence is linear; a hash-backed target remains O(1) average.
  if(block.loops.length){
    const targets=[]; let mm; const mr=/\bif\s+[^:\n]+\s+in\s+([A-Za-z_]\w*)/g;
    while((mm=mr.exec(clean))) targets.push(mm[1]);
    for(const t of targets){
      const hashInit=new RegExp('\\b'+t+'\\s*=\\s*(?:set\\s*\\(|dict\\s*\\(|\\{|HashSet|HashMap|Map\\s*\\()');
      if(!hashInit.test(clean)){ time=maxF(time,factor('quadratic')); block.evidence.push(`Membership in ${t} is conservatively modeled as O(n) inside a traversal.`); break; }
    }
  }
  const sp=spaceComplexity(clean,rec.stack);
  const suggestions=suggestStructures(original);
  const opCount={loops:block.loops.length,sorts:(clean.match(/\bsorted\s*\(|\.sort\s*\(|Arrays\.sort|Collections\.sort|std::sort/g)||[]).length,membership:(clean.match(/\bin\s+[A-Za-z_]\w*|\.contains\s*\(/g)||[]).length,allocations:(clean.match(/\blist\s*\(|\bset\s*\(|\bdict\s*\(|new\s+\w+\s*\[/g)||[]).length};
  return {language:lang,time:formatF(time),space:formatF(sp.space),timeRank:scoreF(time),spaceRank:scoreF(sp.space),confidence:confidence(clean,block.loops,block.evidence),loops:block.loops,evidence:[...block.evidence,...rec.evidence,...sp.why],suggestions,operations:opCount,limitations:buildLimitations(clean,lang)};
}
function buildLimitations(clean,lang){
  const a=[];
  if(/\bwhile\b/.test(clean)) a.push('While-loop bounds are inferred from nearby updates; data-dependent termination can require human review.');
  if(/\b(?:sort|heap|map|set)\b/i.test(clean)) a.push('Library operations use standard average/worst-case models rather than implementation-specific constants.');
  if(/\b(?:eval|exec|reflection)\b/.test(clean)) a.push('Dynamic code execution prevents complete static reasoning.');
  if(!a.length) a.push('Result is a static upper-bound estimate; exact asymptotic analysis is undecidable for arbitrary programs.');
  return a;
}
function suggestStructures(code){
  const s=stripStringsAndComments(code), out=[];
  const push=(id,title,current,better,impact,reason)=>{if(!out.some(x=>x.id===id))out.push({id,title,current,better,impact,reason});};
  if(/for\s+\w+\s+in\s+\w+[\s\S]{0,240}\bif\s+\w+\s+in\s+\w+/.test(s) || /for\s*\([^)]*\)[\s\S]{0,240}\.contains\s*\(/.test(s)) push('membership','Accelerate repeated membership','List / array scan','Hash set','Often O(n²) → O(n)','Membership is performed inside an input-sized loop.');
  if(/\.pop\s*\(\s*0\s*\)|remove\s*\(\s*0\s*\)/.test(s)) push('queue','Use a real queue','Array/list front removal','Deque','O(n) dequeue → O(1)','Removing the first array/list element shifts remaining elements.');
  if(/sorted\s*\([^)]*\)\s*\[\s*0\s*\]|\.sort\s*\([^)]*\)[\s\S]{0,80}\[\s*0\s*\]/.test(s)) push('min','Avoid full sort for minimum','Full sort','Linear min scan','O(n log n) → O(n)','Only the minimum appears to be required.');
  if(/sorted\s*\([^)]*\)\s*\[\s*-1\s*\]/.test(s)) push('max','Avoid full sort for maximum','Full sort','Linear max scan','O(n log n) → O(n)','Only the maximum appears to be required.');
  if(/\b(?:dict|HashMap|Map)\b[\s\S]{0,400}\b(?:min|max)\s*\(|Collections\.(?:min|max)/.test(s)) push('heap','Prioritize repeated extrema','Map + repeated scan','Heap / priority queue','O(n) extrema → O(log n)','Repeated extreme-value retrieval benefits from a heap.');
  if(/\b\w+\s*=\s*\[\][\s\S]{0,300}\.insert\s*\(\s*0\s*,/.test(s)) push('prepend','Optimize repeated prepends','Dynamic array/list','Deque','O(n) prepend → O(1)','Front insertion shifts array elements.');
  if(/\[\s*\[.*for.*\]\s*for.*\]/s.test(s) && /\b(?:graph|adj|edge)/i.test(s)) push('sparsegraph','Use sparse graph storage','Adjacency matrix','Adjacency list','O(V²) space → O(V+E)','Sparse graphs should not allocate every possible edge.');
  if(/\bprefix\b/i.test(s) && /for\b[\s\S]{0,200}for\b/.test(s)) push('prefix','Precompute prefix aggregates','Repeated range scan','Prefix-sum array','O(nq) → O(n+q)','Repeated contiguous range sums can be answered from prefix aggregates.');
  if(/for\b[\s\S]{0,180}for\b[\s\S]{0,180}(==|equals\s*\()/.test(s)) push('pairlookup','Index pair lookups','Nested pair scan','Hash map / set','Often O(n²) → O(n)','One pass can store previously seen values and query complements.');
  return out;
}
function generateEdgeCases(code){
  const s=stripStringsAndComments(code), a=analyzeCode(code), cases=[];
  const add=(name,goal,payload,why)=>cases.push({name,goal,payload,why});
  if(/\bif\s+\w+\s*==\s*(?:target|key)|\.index\s*\(|\bin\s+/.test(s)) add('Missing target','Force full search','array = [1,2,3,…,n], target = value not present','A linear search cannot exit early.');
  if(/sorted\s*\(|\.sort\s*\(/.test(s)) add('Reverse order','Stress ordering work','array = [n,n-1,…,1]','Useful for exposing algorithms whose behavior depends on initial order.');
  if(/\b(?:pivot|quick)/i.test(s)) add('Already sorted','Adversarial pivot placement','array = [1,2,3,…,n]','First/last-element quicksort pivots can degrade to quadratic behavior.');
  if(/for\b[\s\S]{0,220}for\b/.test(s)) add('Maximum pair work','Exercise every nested iteration','n large; choose values so inner-loop early exits never fire','Prevents pruning from hiding the nested-loop upper bound.');
  if(/\b(?:set|HashSet|dict|HashMap)\b/.test(s)) add('All unique','Maximize hash-table growth','n distinct keys','Forces the table to retain O(n) entries.');
  if(/\b(?:heap|PriorityQueue|priority_queue|heapq)\b/.test(s)) add('Monotone priorities','Exercise repeated heap updates','priorities = 1,2,3,…,n','Keeps heap operations active throughout the run.');
  if(/\b(?:BFS|DFS|graph|adj)/i.test(s)) { add('Long chain graph','Maximize traversal depth','V nodes with edges (1→2→…→V)','Produces deep traversal and minimal branching.'); add('Dense graph','Stress edge processing','Complete graph on V nodes','Exercises O(V²) adjacency/edge work where applicable.'); }
  if(/\b\w+\s*\([^)]*(?:-\s*1|-\s*2)/.test(s)) add('Maximum recursion depth','Stress call stack','n as large as safe for the runtime','Additive recursion creates O(n) stack depth.');
  if(/\bwhile\b/.test(s)) add('Slow termination','Exercise conservative loop bound','Choose input that changes loop state by the smallest permitted amount','Data-dependent while loops often hide their worst path in termination behavior.');
  if(!cases.length) add('Scale sweep','Reveal growth empirically','n = 8, 16, 32, 64, 128, 256','Doubling input size helps distinguish constant, logarithmic, linear, and polynomial growth.');
  return {analysis:a,cases};
}
function compareAlgorithms(a,b){
  const A=analyzeCode(a), B=analyzeCode(b);
  let winner='Tie'; if(A.timeRank<B.timeRank)winner='A'; else if(B.timeRank<A.timeRank)winner='B'; else if(A.spaceRank<B.spaceRank)winner='A'; else if(B.spaceRank<A.spaceRank)winner='B';
  const ca=estimateCoefficient(a,A), cb=estimateCoefficient(b,B);
  const crossover=findCrossover(A,ca,B,cb);
  return {A:{...A,coefficient:ca},B:{...B,coefficient:cb},winner,crossover,explanation:winner==='Tie'?'Both snippets have the same inferred asymptotic class; constants and workload details decide.':`${winner} has the better inferred asymptotic profile.`};
}
function estimateCoefficient(code,a){
  const lines=stripStringsAndComments(code).split(/\r?\n/).filter(x=>x.trim()).length;
  return Math.max(1,Math.round((lines + a.operations.loops*4 + a.operations.sorts*8 + a.operations.allocations*2)*10)/10);
}
function evalGrowth(time,n){
  switch(time){case 'O(1)':return 1;case 'O(log n)':return Math.log2(Math.max(2,n));case 'O(n)':return n;case 'O(n log n)':return n*Math.log2(Math.max(2,n));case 'O(n²)':return n*n;case 'O(n³)':return n*n*n;case 'O(2ⁿ)':return Math.pow(2,Math.min(n,40));default:return n*n;}
}
function findCrossover(A,ca,B,cb){
  if(A.time===B.time) return null;
  for(let n=2;n<=100000;n=Math.ceil(n*1.15)+1){ const x=ca*evalGrowth(A.time,n), y=cb*evalGrowth(B.time,n); if((A.timeRank<B.timeRank&&x<y)||(B.timeRank<A.timeRank&&y<x)) return n; }
  return null;
}
function refactorCode(code){
  let out=String(code||''), patches=[];
  if(/\.pop\s*\(\s*0\s*\)/.test(out)){
    const m=out.match(/([A-Za-z_]\w*)\.pop\s*\(\s*0\s*\)/);
    if(m){ const v=m[1]; if(!/from\s+collections\s+import\s+deque/.test(out)) out='from collections import deque\n'+out; out=out.replace(new RegExp('\\b'+v+'\\s*=\\s*\\[([^\\]]*)\\]'),`${v} = deque([$1])`).replace(new RegExp('\\b'+v+'\\.pop\\s*\\(\\s*0\\s*\\)','g'),`${v}.popleft()`); patches.push({title:'List queue → deque',impact:'Front removal O(n) → O(1)'}); }
  }
  out=out.replace(/sorted\s*\(([^\n\)]*)\)\s*\[\s*0\s*\]/g,(m,x)=>{patches.push({title:'Full sort → min()',impact:'O(n log n) → O(n)'});return `min(${x})`;});
  out=out.replace(/sorted\s*\(([^\n\)]*)\)\s*\[\s*-1\s*\]/g,(m,x)=>{patches.push({title:'Full sort → max()',impact:'O(n log n) → O(n)'});return `max(${x})`;});
  const lines=out.split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const loop=lines[i].match(/^(\s*)for\s+(\w+)\s+in\s+(\w+)\s*:/); if(!loop) continue;
    const indent=loop[1].length, body=[]; let j=i+1;
    while(j<lines.length){ const lead=(lines[j].match(/^\s*/)||[''])[0].length; if(lines[j].trim()&&lead<=indent) break; body.push(lines[j]); j++; }
    const bodyText=body.join('\n'); const mem=bodyText.match(/\bif\s+\w+\s+(not\s+)?in\s+(\w+)\s*:/); if(!mem) continue;
    const target=mem[2]; if(new RegExp('\\b'+target+'\\.(?:append|extend|insert|pop|remove|clear)\\b|\\b'+target+'\\s*=').test(bodyText)) continue;
    const setName=target+'_lookup'; lines.splice(i,0,`${loop[1]}${setName} = set(${target})`); i++; for(let k=i+1;k<j+1;k++) lines[k]=lines[k].replace(new RegExp('\\bin\\s+'+target+'\\b'),`in ${setName}`).replace(new RegExp('not\\s+in\\s+'+target+'\\b'),`not in ${setName}`); patches.push({title:'Repeated list membership → set lookup',impact:'Often O(n²) → O(n) average'}); break;
  }
  if(patches.some(p=>p.title.includes('set lookup'))) out=lines.join('\n');
  const before=analyzeCode(code), after=analyzeCode(out);
  return {code:out,patches,before,after,changed:out!==String(code||''),review:'Automated refactors are intentionally conservative. Review semantics and tests before merging.'};
}
return {analyzeCode,suggestStructures,generateEdgeCases,compareAlgorithms,refactorCode,detectLanguage,CLASSES,rank};
});
