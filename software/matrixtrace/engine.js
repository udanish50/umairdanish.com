export function shape(A){return [A.length, A[0]?.length||0]}
export function zeros(r,c){return Array.from({length:r},()=>Array(c).fill(0))}
export function multiply(A,B){const [m,k]=shape(A), [k2,n]=shape(B); if(k!==k2) throw new Error(`Incompatible shapes ${m}×${k} and ${k2}×${n}`); const C=zeros(m,n); for(let i=0;i<m;i++) for(let t=0;t<k;t++){const a=A[i][t]; if(a===0) continue; for(let j=0;j<n;j++) C[i][j]+=a*B[t][j]} return C}
export function transpose(A){const [r,c]=shape(A); return Array.from({length:c},(_,j)=>Array.from({length:r},(_,i)=>A[i][j]))}
export function hadamard(A,B){const [r,c]=shape(A),[r2,c2]=shape(B); if(r!==r2||c!==c2) throw new Error('Hadamard shapes differ'); return A.map((row,i)=>row.map((v,j)=>v*B[i][j]))}
export function kron(A,B){const [ar,ac]=shape(A),[br,bc]=shape(B); return Array.from({length:ar*br},(_,i)=>Array.from({length:ac*bc},(_,j)=>A[Math.floor(i/br)][Math.floor(j/bc)]*B[i%br][j%bc]))}
export function sparsity(A){let z=0,n=0; for(const r of A) for(const v of r){n++; if(v===0) z++} return n?z/n:0}
export function nnz(A){return A.flat().filter(v=>v!==0).length}
export function classifyStructure(A){const [r,c]=shape(A); const sq=r===c; let diagonal=sq, upper=sq, lower=sq, symmetric=sq; let band=0; for(let i=0;i<r;i++) for(let j=0;j<c;j++){const v=A[i][j]; if(i!==j&&v!==0) diagonal=false; if(i>j&&v!==0) upper=false; if(i<j&&v!==0) lower=false; if(sq&&A[j]?.[i]!==v) symmetric=false; if(v!==0) band=Math.max(band,Math.abs(i-j));} return {diagonal,upper,lower,symmetric,bandwidth:band}}
export function memoryModel(A){const [r,c]=shape(A), non=nnz(A); return {denseBytes:r*c*8, csrBytes:non*12+(r+1)*4}}
export function traceCell(A,B,i,j){const [m,k]=shape(A),[k2,n]=shape(B); if(k!==k2||i<0||i>=m||j<0||j>=n) throw new Error('Bad cell'); const terms=[]; let sum=0; for(let t=0;t<k;t++){const p=A[i][t]*B[t][j]; terms.push({a:A[i][t],b:B[t][j],product:p,k:t}); sum+=p} return {terms,sum}}
export function estimateOps(A,B){const [m,k]=shape(A),[k2,n]=shape(B); if(k!==k2) throw new Error('Incompatible shapes'); const denseMult=m*k*n; let sparseMult=0; for(let i=0;i<m;i++) for(let t=0;t<k;t++) if(A[i][t]!==0) for(let j=0;j<n;j++) if(B[t][j]!==0) sparseMult++; return {denseMult,sparseMult,skipped:denseMult-sparseMult}}
export function normalizeRows(A){return A.map(r=>{const s=Math.sqrt(r.reduce((x,v)=>x+v*v,0))||1; return r.map(v=>v/s)})}
export function slice(A,r0,r1,c0,c1){return A.slice(r0,r1).map(r=>r.slice(c0,c1))}
export function parseMatrix(text){const A=text.trim().split(/\n+/).map(r=>r.trim().split(/[\s,]+/).filter(Boolean).map(Number)); if(!A.length||!A[0].length||A.some(r=>r.length!==A[0].length)||A.flat().some(Number.isNaN)) throw new Error('Use rows separated by lines and values by spaces or commas.'); return A}
export function format(A){return A.map(r=>r.map(v=>Number.isInteger(v)?String(v):Number(v.toFixed(4))).join('\t')).join('\n')}

export function approximatelyEqual(a,b,tol=1e-7){return Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b))}
export function parseMatrixMarket(text){
  const lines=text.replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
  if(!lines[0]?.toLowerCase().startsWith('%%matrixmarket matrix')) throw new Error('Not a Matrix Market file');
  const h=lines[0].toLowerCase(); const coordinate=h.includes('coordinate'); const symmetric=h.includes('symmetric');
  const data=lines.slice(1).filter(x=>!x.startsWith('%'));
  if(coordinate){
    const dims=data.shift().split(/\s+/).map(Number); const [r,c]=dims; const A=zeros(r,c);
    for(const line of data){const p=line.split(/\s+/); if(p.length<2)continue; const i=Number(p[0])-1,j=Number(p[1])-1,v=p.length>=3?Number(p[2]):1; if(Number.isFinite(i)&&Number.isFinite(j)&&Number.isFinite(v)&&A[i]?.[j]!==undefined){A[i][j]=v;if(symmetric&&i!==j&&A[j]?.[i]!==undefined)A[j][i]=v}}
    return A;
  }
  const dims=data.shift().split(/\s+/).map(Number); const [r,c]=dims; const vals=data.flatMap(x=>x.split(/\s+/).map(Number)).filter(Number.isFinite); const A=zeros(r,c); let q=0;
  for(let j=0;j<c;j++)for(let i=0;i<r;i++)A[i][j]=vals[q++]??0; return A;
}
export function parseTabularMatrix(text){
  const raw=text.replace(/\r/g,'').split('\n').filter(x=>x.trim().length);
  if(!raw.length)throw new Error('The file is empty.');
  const delimiter=raw.some(x=>x.includes('\t'))?'\t':raw.some(x=>x.includes(','))?',':raw.some(x=>x.includes(';'))?';':null;
  const split=line=>delimiter?line.split(delimiter):line.trim().split(/\s+/);
  const rows=raw.map(split).map(r=>r.map(x=>x.trim().replace(/^"|"$/g,'')));
  const maxCols=Math.max(...rows.map(r=>r.length));
  const scores=Array.from({length:maxCols},(_,j)=>{let n=0,t=0;for(const r of rows.slice(1)){if(j<r.length){t++;if(r[j]!==''&&Number.isFinite(Number(r[j])))n++}}return t?n/t:0});
  let keep=scores.map((s,j)=>s>=0.7?j:-1).filter(j=>j>=0);
  const firstAllNumeric=rows[0].every(x=>x!==''&&Number.isFinite(Number(x)));
  if(firstAllNumeric) keep=Array.from({length:rows[0].length},(_,i)=>i);
  if(!keep.length){
    const simple=rows.map(r=>r.filter(x=>x!=='').map(Number));
    if(simple.every(r=>r.length===simple[0].length&&r.every(Number.isFinite)))return simple;
    throw new Error('No consistent numeric columns were detected.');
  }
  const start=firstAllNumeric?0:1; const A=[];
  for(const r of rows.slice(start)){const vals=keep.map(j=>Number(r[j]));if(vals.every(Number.isFinite))A.push(vals)}
  if(!A.length)throw new Error('No numeric rows were detected.'); return A;
}
export function parseUploadedMatrix(text,filename=''){
  const t=text.trim(); const name=filename.toLowerCase();
  if(name.endsWith('.mtx')||t.startsWith('%%MatrixMarket'))return parseMatrixMarket(t);
  if(name.endsWith('.json')||t.startsWith('[')){const x=JSON.parse(t);if(!Array.isArray(x)||!Array.isArray(x[0]))throw new Error('JSON must be a 2-D numeric array.');const A=x.map(r=>r.map(Number));if(A.some(r=>r.length!==A[0].length||r.some(v=>!Number.isFinite(v))))throw new Error('JSON matrix must be rectangular and numeric.');return A}
  return parseTabularMatrix(t);
}
