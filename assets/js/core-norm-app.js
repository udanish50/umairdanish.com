(function () {
  'use strict';
  const root = document.querySelector('[data-core-norm-app]');
  if (!root || !window.CoreNormEngine) return;

  const $ = (s) => root.querySelector(s);
  const els = {
    file: $('[data-cn-file]'), sample: $('[data-cn-sample]'), features: $('[data-cn-features]'),
    fraction: $('[data-cn-fraction]'), fractionLabel: $('[data-cn-fraction-label]'),
    run: $('[data-cn-run]'), status: $('[data-cn-status]'), preview: $('[data-cn-preview]'),
    metrics: $('[data-cn-roundtrip]'), downloads: $('[data-cn-downloads]'),
    transformed: $('[data-cn-download-transformed]'), reconstructed: $('[data-cn-download-reconstructed]'),
    state: $('[data-cn-download-state]'), reset: $('[data-cn-reset]')
  };

  let dataset = null, result = null;

  const sampleCSV = `timestamp,temperature_c,humidity_pct,ghi_wm2,power_kw\n2026-03-06 09:10,7.8,78,118,1.2\n2026-03-06 09:20,8.6,75,226,1.9\n2026-03-06 09:30,9.4,72,355,2.8\n2026-03-06 09:40,10.3,69,510,4.0\n2026-03-06 09:50,11.1,65,675,5.1\n2026-03-06 10:00,11.8,62,808,6.0\n2026-03-06 10:10,12.4,60,918,6.8\n2026-03-06 10:20,12.9,58,1048,7.6\n2026-03-06 10:30,13.1,59,1410,8.9\n2026-03-06 10:40,12.7,64,735,5.8\n2026-03-06 10:50,12.5,66,702,5.5\n2026-03-06 11:00,12.2,68,655,5.1`;

  function parseCSV(text) {
    const rows=[]; let row=[], field='', quoted=false;
    for (let i=0;i<text.length;i++) {
      const ch=text[i], next=text[i+1];
      if (quoted) {
        if (ch==='"' && next==='"') { field+='"'; i++; }
        else if (ch==='"') quoted=false;
        else field+=ch;
      } else {
        if (ch==='"') quoted=true;
        else if (ch===',') { row.push(field); field=''; }
        else if (ch==='\n') { row.push(field.replace(/\r$/,'')); rows.push(row); row=[]; field=''; }
        else field+=ch;
      }
    }
    if (field.length || row.length) { row.push(field.replace(/\r$/,'')); rows.push(row); }
    const clean=rows.filter(r=>r.some(v=>v.trim()!==''));
    if (clean.length<2) throw new Error('CSV needs a header and at least one data row.');
    const headers=clean[0].map((h,i)=>h.trim() || `column_${i+1}`);
    const data=clean.slice(1).map(r=>headers.map((_,i)=>r[i] ?? ''));
    return {headers, rows:data};
  }

  function detectNumeric(ds) {
    return ds.headers.map((_,j)=>{
      const vals=ds.rows.map(r=>r[j].trim()).filter(Boolean);
      const finiteCount=vals.filter(v=>Number.isFinite(Number(v))).length;
      return vals.length>0 && finiteCount===vals.length;
    });
  }

  function setDataset(ds, label) {
    dataset=ds; result=null; els.preview.innerHTML=''; els.metrics.hidden=true; els.downloads.hidden=true;
    const numeric=detectNumeric(ds);
    els.features.innerHTML='';
    ds.headers.forEach((h,j)=>{
      const item=document.createElement('label'); item.className='cn-feature-option';
      const input=document.createElement('input'); input.type='checkbox'; input.value=String(j); input.checked=numeric[j]; input.disabled=!numeric[j];
      const text=document.createElement('span'); text.innerHTML=`<strong>${escapeHTML(h)}</strong><small>${numeric[j]?'numeric · selected':'non-numeric · preserved'}</small>`;
      item.append(input,text); els.features.append(item);
    });
    els.run.disabled=!numeric.some(Boolean);
    say(`${label}: ${ds.rows.length.toLocaleString()} rows · ${numeric.filter(Boolean).length} numeric features detected.`, 'ok');
  }

  function selectedIndexes() { return [...els.features.querySelectorAll('input:checked')].map(x=>Number(x.value)); }
  function toNumber(v) { const s=String(v).trim(); return s===''?null:Number(s); }
  function escapeHTML(s) { return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function fmt(v) { if (v===null || !Number.isFinite(v)) return '—'; const a=Math.abs(v); return a!==0 && (a>=1e5 || a<1e-4) ? v.toExponential(4) : Number(v.toFixed(6)).toString(); }
  function say(msg, tone='') { els.status.textContent=msg; els.status.dataset.tone=tone; }

  function csvEscape(v) { const s=v==null?'':String(v); return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
  function toCSV(headers, rows) { return [headers.map(csvEscape).join(','), ...rows.map(r=>r.map(csvEscape).join(','))].join('\n')+'\n'; }
  function download(name, content, type='text/csv;charset=utf-8') { const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.append(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0); }

  function run() {
    try {
      if (!dataset) throw new Error('Load a CSV or the sample first.');
      const idx=selectedIndexes(); if (!idx.length) throw new Error('Select at least one numeric feature.');
      const matrix=dataset.rows.map(r=>idx.map(j=>toNumber(r[j])));
      const fraction=Number(els.fraction.value)/100;
      const fitRows=Math.max(4,Math.min(matrix.length,Math.ceil(matrix.length*fraction)));
      if (fitRows<4) throw new Error('At least four fit rows are required.');
      const engine=new CoreNormEngine().fit(matrix.slice(0,fitRows));
      const encoded=engine.transform(matrix), restored=engine.inverse(encoded);
      let maxErr=0, sumErr=0, nErr=0;
      for (let i=0;i<matrix.length;i++) for (let j=0;j<idx.length;j++) if (Number.isFinite(matrix[i][j])) {
        const e=Math.abs(matrix[i][j]-restored[i][j]); maxErr=Math.max(maxErr,e); sumErr+=e; nErr++;
      }
      result={idx,matrix,engine,encoded,restored,fitRows,maxErr,meanErr:nErr?sumErr/nErr:0};
      renderPreview();
      $('[data-cn-fit-rows]').textContent=fitRows.toLocaleString();
      $('[data-cn-max-error]').textContent=fmt(maxErr);
      $('[data-cn-mean-error]').textContent=fmt(result.meanErr);
      els.metrics.hidden=false; els.downloads.hidden=false;
      say(`Core-Norm fitted on the first ${fitRows.toLocaleString()} rows and transformed all ${matrix.length.toLocaleString()} rows locally in your browser.`, 'ok');
    } catch (err) { say(err.message || String(err), 'error'); }
  }

  function renderPreview() {
    const names=result.idx.map(j=>dataset.headers[j]); const p=names.length;
    const headers=['Row', ...names.map(n=>`${n} · central`), ...names.map(n=>`${n} · residual`)];
    const rows=result.encoded.slice(0,8).map((z,i)=>[String(i+1), ...z.map(fmt)]);
    els.preview.innerHTML=`<div class="cn-table-scroll"><table><thead><tr>${headers.map(h=>`<th>${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map((v,j)=>`<${j?'td':'th'}>${escapeHTML(v)}</${j?'td':'th'}>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function transformedDownload() {
    if (!result) return; const selected=new Set(result.idx); const names=result.idx.map(j=>dataset.headers[j]);
    const headers=dataset.headers.filter((_,j)=>!selected.has(j)).concat(names.map(n=>`${n}__central`), names.map(n=>`${n}__residual`));
    const rows=dataset.rows.map((r,i)=>r.filter((_,j)=>!selected.has(j)).concat(result.encoded[i].map(v=>v==null?'':String(v))));
    download('core-norm-transformed.csv',toCSV(headers,rows));
  }

  function reconstructedDownload() {
    if (!result) return; const map=new Map(result.idx.map((j,k)=>[j,k]));
    const rows=dataset.rows.map((r,i)=>r.map((v,j)=>map.has(j)?(result.restored[i][map.get(j)]??''):v));
    download('core-norm-reconstructed.csv',toCSV(dataset.headers,rows));
  }

  function stateDownload() {
    if (!result) return; const names=result.idx.map(j=>dataset.headers[j]);
    download('core-norm-state.json',JSON.stringify(result.engine.state(names),null,2)+'\n','application/json;charset=utf-8');
  }

  els.sample.addEventListener('click',()=>setDataset(parseCSV(sampleCSV),'Weather/energy sample loaded'));
  els.file.addEventListener('change',async()=>{
    try { const f=els.file.files[0]; if(!f)return; if(f.size>10*1024*1024) throw new Error('For this browser demo, choose a CSV smaller than 10 MB.'); setDataset(parseCSV(await f.text()),f.name); }
    catch(err){ say(err.message||String(err),'error'); }
  });
  els.fraction.addEventListener('input',()=>{els.fractionLabel.textContent=`${els.fraction.value}%`;});
  els.run.addEventListener('click',run); els.transformed.addEventListener('click',transformedDownload); els.reconstructed.addEventListener('click',reconstructedDownload); els.state.addEventListener('click',stateDownload);
  els.reset.addEventListener('click',()=>{dataset=null;result=null;els.file.value='';els.features.innerHTML='<p class="cn-empty">Load data to detect numeric features.</p>';els.preview.innerHTML='';els.metrics.hidden=true;els.downloads.hidden=true;els.run.disabled=true;say('No data loaded.');});
})( );
