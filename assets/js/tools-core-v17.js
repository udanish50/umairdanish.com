(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.UmairTools=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const round=(n,d=6)=>{ if(!Number.isFinite(n)) return NaN; const p=10**d; return Math.round((n+Number.EPSILON)*p)/p; };
  const fmt=(n,d=6)=>Number.isFinite(n)?new Intl.NumberFormat(undefined,{maximumFractionDigits:d}).format(n):'—';

  const UNITS={
    length:{label:'Length',base:'m',units:{m:['Metres',1],km:['Kilometres',1000],cm:['Centimetres',.01],mm:['Millimetres',.001],mi:['Miles',1609.344],yd:['Yards',.9144],ft:['Feet',.3048],in:['Inches',.0254]}},
    weight:{label:'Weight',base:'kg',units:{kg:['Kilograms',1],g:['Grams',.001],lb:['Pounds',.45359237],oz:['Ounces',.028349523125],st:['Stone',6.35029318]}},
    area:{label:'Area',base:'m2',units:{m2:['Square metres',1],km2:['Square kilometres',1e6],cm2:['Square centimetres',1e-4],ft2:['Square feet',.09290304],yd2:['Square yards',.83612736],acre:['Acres',4046.8564224],ha:['Hectares',10000],mi2:['Square miles',2589988.110336]}},
    volume:{label:'Volume',base:'l',units:{l:['Litres',1],ml:['Millilitres',.001],m3:['Cubic metres',1000],gal_us:['US gallons',3.785411784],gal_imp:['Imperial gallons',4.54609],qt_us:['US quarts',.946352946],cup_us:['US cups',.2365882365],floz_us:['US fl oz',.0295735295625]}},
    speed:{label:'Speed',base:'mps',units:{mps:['Metres/second',1],kmh:['Kilometres/hour',1/3.6],mph:['Miles/hour',.44704],knot:['Knots',.514444444444]}},
    data:{label:'Data',base:'B',units:{B:['Bytes',1],KB:['Kilobytes (10³)',1e3],MB:['Megabytes (10⁶)',1e6],GB:['Gigabytes (10⁹)',1e9],KiB:['Kibibytes (2¹⁰)',1024],MiB:['Mebibytes (2²⁰)',1048576],GiB:['Gibibytes (2³⁰)',1073741824]}},
    temperature:{label:'Temperature',base:'C',units:{C:['Celsius',null],F:['Fahrenheit',null],K:['Kelvin',null]}}
  };
  function convertUnit(value,category,from,to){
    value=Number(value); if(!Number.isFinite(value)) return NaN;
    if(category==='temperature'){
      let c=from==='C'?value:from==='F'?(value-32)*5/9:value-273.15;
      return to==='C'?c:to==='F'?c*9/5+32:c+273.15;
    }
    const c=UNITS[category]; if(!c||!c.units[from]||!c.units[to]) return NaN;
    return value*c.units[from][1]/c.units[to][1];
  }
  const percentageOf=(p,x)=>Number(x)*Number(p)/100;
  const percentageChange=(a,b)=>Number(a)===0?NaN:(Number(b)-Number(a))/Math.abs(Number(a))*100;
  const discount=(price,p)=>({saved:Number(price)*Number(p)/100,final:Number(price)*(1-Number(p)/100)});
  const whatPercent=(part,whole)=>Number(whole)===0?NaN:Number(part)/Number(whole)*100;

  function textStats(text){
    text=String(text||''); const trimmed=text.trim();
    let words=[];
    if(trimmed){
      if(typeof Intl!=='undefined'&&Intl.Segmenter){ words=[...new Intl.Segmenter(undefined,{granularity:'word'}).segment(trimmed)].filter(x=>x.isWordLike).map(x=>x.segment); }
      else words=trimmed.match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)||[];
    }
    const sentences=trimmed?(trimmed.match(/[^.!?\n]+(?:[.!?]+|$)/g)||[]).filter(s=>s.trim()).length:0;
    const paragraphs=trimmed?trimmed.split(/\n\s*\n+/).filter(Boolean).length:0;
    return {words:words.length,characters:text.length,charactersNoSpaces:text.replace(/\s/g,'').length,sentences,paragraphs,readingMinutes:words.length?Math.max(1,Math.ceil(words.length/225)):0,speakingMinutes:words.length?Math.max(1,Math.ceil(words.length/130)):0};
  }
  function cleanText(text,action){
    text=String(text||'');
    switch(action){
      case 'spaces': return text.split('\n').map(x=>x.replace(/[ \t]+/g,' ').trim()).join('\n');
      case 'blank': return text.replace(/\n[ \t]*\n+/g,'\n');
      case 'duplicates': { const seen=new Set(); return text.split('\n').filter(x=>{const k=x.trim(); if(seen.has(k)) return false; seen.add(k); return true;}).join('\n'); }
      case 'sort-asc': return text.split('\n').sort((a,b)=>a.localeCompare(b,undefined,{sensitivity:'base'})).join('\n');
      case 'sort-desc': return text.split('\n').sort((a,b)=>b.localeCompare(a,undefined,{sensitivity:'base'})).join('\n');
      case 'upper': return text.toUpperCase();
      case 'lower': return text.toLowerCase();
      case 'title': return text.toLowerCase().replace(/\b([\p{L}\p{N}])/gu,m=>m.toUpperCase());
      case 'sentence': return text.toLowerCase().replace(/(^|[.!?]\s+|\n\s*)([\p{L}])/gu,(m,p,c)=>p+c.toUpperCase());
      default:return text;
    }
  }

  function parseISODate(s){ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||'')); if(!m)return null; const y=+m[1],mo=+m[2],d=+m[3]; const dt=new Date(Date.UTC(y,mo-1,d)); return dt.getUTCFullYear()===y&&dt.getUTCMonth()===mo-1&&dt.getUTCDate()===d?{y,mo,d}:null; }
  const daysInMonth=(y,m)=>new Date(Date.UTC(y,m,0)).getUTCDate();
  function compareYMD(a,b){ return a.y-b.y||a.mo-b.mo||a.d-b.d; }
  function addMonthsClamped(d,months){ const total=d.y*12+(d.mo-1)+months; const y=Math.floor(total/12); const mo=((total%12)+12)%12+1; return {y,mo,d:Math.min(d.d,daysInMonth(y,mo))}; }
  function ageBetween(birth,asof){ birth=typeof birth==='string'?parseISODate(birth):birth; asof=typeof asof==='string'?parseISODate(asof):asof; if(!birth||!asof||compareYMD(birth,asof)>0)return null; let years=asof.y-birth.y; let anchor={y:birth.y+years,mo:birth.mo,d:Math.min(birth.d,daysInMonth(birth.y+years,birth.mo))}; if(compareYMD(anchor,asof)>0){years--;anchor={y:birth.y+years,mo:birth.mo,d:Math.min(birth.d,daysInMonth(birth.y+years,birth.mo))};} let months=0,cur=anchor; while(months<11){const nxt=addMonthsClamped(anchor,months+1); if(compareYMD(nxt,asof)<=0){months++;cur=nxt;}else break;} const curMs=Date.UTC(cur.y,cur.mo-1,cur.d), asMs=Date.UTC(asof.y,asof.mo-1,asof.d), bMs=Date.UTC(birth.y,birth.mo-1,birth.d); const days=Math.round((asMs-curMs)/86400000); const totalDays=Math.round((asMs-bMs)/86400000); return {years,months,days,totalDays,weeks:Math.floor(totalDays/7),weekDays:totalDays%7}; }
  function dateDifference(a,b){ a=typeof a==='string'?parseISODate(a):a; b=typeof b==='string'?parseISODate(b):b; if(!a||!b)return null; const am=Date.UTC(a.y,a.mo-1,a.d),bm=Date.UTC(b.y,b.mo-1,b.d),sgn=bm>=am?1:-1,totalDays=Math.round(Math.abs(bm-am)/86400000); return {totalDays,weeks:Math.floor(totalDays/7),days:totalDays%7,direction:sgn}; }
  function addToDate(date,amount,unit){ date=typeof date==='string'?parseISODate(date):date; amount=Number(amount); if(!date||!Number.isFinite(amount))return null; amount=Math.trunc(amount); if(unit==='days'||unit==='weeks'){ const n=unit==='weeks'?amount*7:amount; const dt=new Date(Date.UTC(date.y,date.mo-1,date.d+n)); return {y:dt.getUTCFullYear(),mo:dt.getUTCMonth()+1,d:dt.getUTCDate()}; } if(unit==='months')return addMonthsClamped(date,amount); if(unit==='years')return {y:date.y+amount,mo:date.mo,d:Math.min(date.d,daysInMonth(date.y+amount,date.mo))}; return null; }
  const ymdToString=d=>d?`${String(d.y).padStart(4,'0')}-${String(d.mo).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`:'';

  function zonedParts(date,zone){ const parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date); const o={}; for(const p of parts) if(p.type!=='literal')o[p.type]=p.value; return {y:+o.year,mo:+o.month,d:+o.day,h:+o.hour,mi:+o.minute,s:+o.second}; }
  function wallTimeToUtc(dateStr,timeStr,zone){ const d=parseISODate(dateStr), tm=/^(\d{1,2}):(\d{2})$/.exec(String(timeStr||'')); if(!d||!tm)return null; const hh=+tm[1],mm=+tm[2]; if(hh>23||mm>59)return null; const target=Date.UTC(d.y,d.mo-1,d.d,hh,mm); let guess=target; for(let i=0;i<5;i++){ const p=zonedParts(new Date(guess),zone); const seen=Date.UTC(p.y,p.mo-1,p.d,p.h,p.mi,p.s); const diff=target-seen; guess+=diff; if(Math.abs(diff)<1000)break; } const matches=[]; for(let delta=-6;delta<=6;delta++){ const ms=guess+delta*30*60000,p=zonedParts(new Date(ms),zone); if(p.y===d.y&&p.mo===d.mo&&p.d===d.d&&p.h===hh&&p.mi===mm)matches.push(ms); } const unique=[...new Set(matches)]; return unique.length===1?new Date(unique[0]):null; }
  function formatInZone(instant,zone,sourceDate){ if(!(instant instanceof Date)||Number.isNaN(instant.valueOf()))return null; const p=zonedParts(instant,zone), src=parseISODate(sourceDate); const dayDelta=src?Math.round((Date.UTC(p.y,p.mo-1,p.d)-Date.UTC(src.y,src.mo-1,src.d))/86400000):0; const time=new Intl.DateTimeFormat('en-CA',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(instant); return {time,date:ymdToString(p),dayDelta,parts:p}; }

  function secureRandomInt(max,cryptoObj){ if(max<=0)throw new Error('max'); cryptoObj=cryptoObj||(typeof crypto!=='undefined'?crypto:null); if(!cryptoObj||!cryptoObj.getRandomValues)throw new Error('Secure random generator unavailable'); const limit=Math.floor(0x100000000/max)*max; const a=new Uint32Array(1); do{cryptoObj.getRandomValues(a);}while(a[0]>=limit); return a[0]%max; }
  function generatePassword(options={},cryptoObj){ const sets={upper:'ABCDEFGHJKLMNPQRSTUVWXYZ',lower:'abcdefghijkmnopqrstuvwxyz',numbers:'23456789',symbols:'!@#$%^&*()-_=+[]{};:,.?'}; if(!options.avoidAmbiguous){sets.upper+='IO';sets.lower+='l';sets.numbers+='01';} const chosen=[]; if(options.upper!==false)chosen.push(sets.upper); if(options.lower!==false)chosen.push(sets.lower); if(options.numbers!==false)chosen.push(sets.numbers); if(options.symbols!==false)chosen.push(sets.symbols); if(!chosen.length)throw new Error('Select at least one character set'); const length=Math.max(chosen.length,Math.min(128,Math.max(8,Number(options.length)||20))); const pool=chosen.join(''); const out=chosen.map(s=>s[secureRandomInt(s.length,cryptoObj)]); while(out.length<length)out.push(pool[secureRandomInt(pool.length,cryptoObj)]); for(let i=out.length-1;i>0;i--){const j=secureRandomInt(i+1,cryptoObj);[out[i],out[j]]=[out[j],out[i]];} const entropy=length*Math.log2(pool.length); return {password:out.join(''),entropy,label:entropy>=100?'Very strong':entropy>=75?'Strong':entropy>=55?'Good':entropy>=40?'Fair':'Weak'}; }

  // QR Code Model 2 byte-mode encoder, EC level M. Algorithm/table adapted from the MIT-licensed python-qrcode project.
  const QR_POS=[[],[6,18],[6,22],[6,26],[6,30],[6,34],[6,22,38],[6,24,42],[6,26,46],[6,28,50],[6,30,54],[6,32,58],[6,34,62],[6,26,46,66],[6,26,48,70],[6,26,50,74],[6,30,54,78],[6,30,56,82],[6,30,58,86],[6,34,62,90]];
  const QR_RS=[null,[1,26,16],[1,44,28],[1,70,44],[2,50,32],[2,67,43],[4,43,27],[4,49,31],[2,60,38,2,61,39],[3,58,36,2,59,37],[4,69,43,1,70,44],[1,80,50,4,81,51],[6,58,36,2,59,37],[8,59,37,1,60,38],[4,64,40,5,65,41],[5,65,41,5,66,42],[7,73,45,3,74,46],[10,74,46,1,75,47],[9,69,43,4,70,44],[3,70,44,11,71,45],[3,67,41,13,68,42]];
  const EXP=new Array(256),LOG=new Array(256); for(let i=0;i<8;i++)EXP[i]=1<<i; for(let i=8;i<256;i++)EXP[i]=EXP[i-4]^EXP[i-5]^EXP[i-6]^EXP[i-8]; for(let i=0;i<255;i++)LOG[EXP[i]]=i;
  const gexp=n=>EXP[((n%255)+255)%255], glog=n=>{if(n<1)throw new Error('glog');return LOG[n];};
  class Poly{ constructor(num,shift=0){let o=0;while(o<num.length&&num[o]===0)o++;this.num=num.slice(o).concat(new Array(shift).fill(0));if(!this.num.length)this.num=[0];} mul(other){const out=new Array(this.num.length+other.num.length-1).fill(0);for(let i=0;i<this.num.length;i++)for(let j=0;j<other.num.length;j++)if(this.num[i]&&other.num[j])out[i+j]^=gexp(glog(this.num[i])+glog(other.num[j]));return new Poly(out);} mod(other){let num=this.num.slice();while(num.length>=other.num.length&&num[0]!==0){const ratio=glog(num[0])-glog(other.num[0]);for(let i=0;i<other.num.length;i++)if(other.num[i])num[i]^=gexp(glog(other.num[i])+ratio);while(num.length&&num[0]===0)num.shift();}return new Poly(num.length?num:[0]);} }
  class BitBuffer{constructor(){this.buffer=[];this.length=0;} put(num,len){for(let i=len-1;i>=0;i--)this.putBit(((num>>>i)&1)===1);} putBit(bit){const idx=Math.floor(this.length/8);if(this.buffer.length<=idx)this.buffer.push(0);if(bit)this.buffer[idx]|=0x80>>(this.length%8);this.length++;}}
  function rsBlocks(v){const row=QR_RS[v],out=[];for(let i=0;i<row.length;i+=3)for(let c=0;c<row[i];c++)out.push({total:row[i+1],data:row[i+2]});return out;}
  function bchDigit(d){let n=0;while(d){n++;d>>>=1;}return n;}
  const G15=(1<<10)|(1<<8)|(1<<5)|(1<<4)|(1<<2)|(1<<1)|1,G18=(1<<12)|(1<<11)|(1<<10)|(1<<9)|(1<<8)|(1<<5)|(1<<2)|1,G15MASK=(1<<14)|(1<<12)|(1<<10)|(1<<4)|(1<<1);
  function bchInfo(data){let d=data<<10;while(bchDigit(d)-bchDigit(G15)>=0)d^=G15<<(bchDigit(d)-bchDigit(G15));return ((data<<10)|d)^G15MASK;}
  function bchNumber(data){let d=data<<12;while(bchDigit(d)-bchDigit(G18)>=0)d^=G18<<(bchDigit(d)-bchDigit(G18));return (data<<12)|d;}
  function maskFn(p,i,j){switch(p){case 0:return(i+j)%2===0;case 1:return i%2===0;case 2:return j%3===0;case 3:return(i+j)%3===0;case 4:return(Math.floor(i/2)+Math.floor(j/3))%2===0;case 5:return(i*j)%2+(i*j)%3===0;case 6:return((i*j)%2+(i*j)%3)%2===0;case 7:return((i*j)%3+(i+j)%2)%2===0;}}
  function makeData(version,bytes){const blocks=rsBlocks(version),limit=blocks.reduce((a,b)=>a+b.data*8,0),bb=new BitBuffer();bb.put(4,4);bb.put(bytes.length,version<10?8:16);for(const b of bytes)bb.put(b,8);if(bb.length>limit)throw new Error('QR content is too long');for(let i=0;i<Math.min(limit-bb.length,4);i++)bb.putBit(false);while(bb.length%8)bb.putBit(false);for(let i=0;bb.length<limit;i++)bb.put(i%2?0x11:0xec,8);let off=0,maxD=0,maxE=0,dc=[],ec=[];for(const block of blocks){const d=bb.buffer.slice(off,off+block.data);off+=block.data;const ecount=block.total-block.data;maxD=Math.max(maxD,d.length);maxE=Math.max(maxE,ecount);let gen=new Poly([1]);for(let i=0;i<ecount;i++)gen=gen.mul(new Poly([1,gexp(i)]));const mod=new Poly(d,gen.num.length-1).mod(gen).num;const e=new Array(ecount).fill(0);for(let i=0;i<ecount;i++){const mi=i+mod.length-ecount;e[i]=mi>=0?mod[mi]:0;}dc.push(d);ec.push(e);}const out=[];for(let i=0;i<maxD;i++)for(const d of dc)if(i<d.length)out.push(d[i]);for(let i=0;i<maxE;i++)for(const e of ec)if(i<e.length)out.push(e[i]);return out;}
  function qrBlank(v){const n=v*4+17,m=Array.from({length:n},()=>Array(n).fill(null));function probe(row,col){for(let r=-1;r<=7;r++){if(row+r<0||row+r>=n)continue;for(let c=-1;c<=7;c++){if(col+c<0||col+c>=n)continue;m[row+r][col+c]=(r>=0&&r<=6&&(c===0||c===6))||(c>=0&&c<=6&&(r===0||r===6))||(r>=2&&r<=4&&c>=2&&c<=4);}}}probe(0,0);probe(n-7,0);probe(0,n-7);const pos=QR_POS[v-1]||[];for(const row of pos)for(const col of pos){if(m[row][col]!==null)continue;for(let r=-2;r<=2;r++)for(let c=-2;c<=2;c++)m[row+r][col+c]=r===-2||r===2||c===-2||c===2||(r===0&&c===0);}for(let r=8;r<n-8;r++)if(m[r][6]===null)m[r][6]=r%2===0;for(let c=8;c<n-8;c++)if(m[6][c]===null)m[6][c]=c%2===0;return m;}
  function setupInfo(m,v,mask,test){const n=m.length,bits=bchInfo(mask);for(let i=0;i<15;i++){const mod=!test&&((bits>>i)&1)===1;if(i<6)m[i][8]=mod;else if(i<8)m[i+1][8]=mod;else m[n-15+i][8]=mod;}for(let i=0;i<15;i++){const mod=!test&&((bits>>i)&1)===1;if(i<8)m[8][n-i-1]=mod;else if(i<9)m[8][15-i]=mod;else m[8][15-i-1]=mod;}m[n-8][8]=!test;if(v>=7){const vb=bchNumber(v);for(let i=0;i<18;i++){const mod=!test&&((vb>>i)&1)===1;m[Math.floor(i/3)][i%3+n-11]=mod;m[i%3+n-11][Math.floor(i/3)]=mod;}}}
  function mapQr(m,data,mask){const n=m.length;let inc=-1,row=n-1,bit=7,byte=0;for(let col=n-1;col>0;col-=2){if(col===6)col--;while(true){for(const c of [col,col-1])if(m[row][c]===null){let dark=byte<data.length?((data[byte]>>bit)&1)===1:false;if(maskFn(mask,row,c))dark=!dark;m[row][c]=dark;bit--;if(bit===-1){byte++;bit=7;}}row+=inc;if(row<0||row>=n){row-=inc;inc=-inc;break;}}}}
  function lost(m){const n=m.length;let score=0;for(let r=0;r<n;r++){let run=1;for(let c=1;c<n;c++){if(m[r][c]===m[r][c-1])run++;else{if(run>=5)score+=3+(run-5);run=1;}}if(run>=5)score+=3+(run-5);}for(let c=0;c<n;c++){let run=1;for(let r=1;r<n;r++){if(m[r][c]===m[r-1][c])run++;else{if(run>=5)score+=3+(run-5);run=1;}}if(run>=5)score+=3+(run-5);}for(let r=0;r<n-1;r++)for(let c=0;c<n-1;c++){const v=m[r][c];if(v===m[r+1][c]&&v===m[r][c+1]&&v===m[r+1][c+1])score+=3;}const pat='1011101';for(let r=0;r<n;r++){const s=m[r].map(x=>x?'1':'0').join('');for(let i=0;i<=n-11;i++){const t=s.slice(i,i+11);if(t==='10111010000'||t==='00001011101')score+=40;}}for(let c=0;c<n;c++){let s='';for(let r=0;r<n;r++)s+=m[r][c]?'1':'0';for(let i=0;i<=n-11;i++){const t=s.slice(i,i+11);if(t==='10111010000'||t==='00001011101')score+=40;}}const dark=m.flat().filter(Boolean).length;score+=Math.floor(Math.abs(dark*100/(n*n)-50)/5)*10;return score;}
  function qrMatrix(text){const bytes=[...new TextEncoder().encode(String(text))];let version=1;for(;version<=20;version++){const capacity=rsBlocks(version).reduce((a,b)=>a+b.data*8,0);const needed=4+(version<10?8:16)+bytes.length*8;if(needed<=capacity)break;}if(version>20)throw new Error('QR content is too long (maximum about 650 UTF-8 bytes).');const data=makeData(version,bytes);let best=null,bestScore=Infinity;for(let mask=0;mask<8;mask++){const m=qrBlank(version);setupInfo(m,version,mask,true);mapQr(m,data,mask);const s=lost(m);if(s<bestScore){bestScore=s;best=mask;}}const m=qrBlank(version);setupInfo(m,version,best,false);mapQr(m,data,best);return {matrix:m,version,mask:best};}
  function qrSvg(text,options={}){const q=qrMatrix(text),border=Number.isFinite(options.border)?Math.max(4,options.border):4,n=q.matrix.length,size=n+border*2;let path='';for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.matrix[r][c])path+=`M${c+border} ${r+border}h1v1h-1z`;return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#111318"/></svg>`;}

  return {round,fmt,UNITS,convertUnit,percentageOf,percentageChange,discount,whatPercent,textStats,cleanText,parseISODate,ageBetween,dateDifference,addToDate,ymdToString,wallTimeToUtc,formatInZone,generatePassword,qrMatrix,qrSvg};
});
