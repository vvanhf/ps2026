import { getStore } from '@netlify/blobs';
import QRCode from 'qrcode';
const COUNTRIES=['BNL','FR','UK','ES'];
const DEFAULT_PRODUCTS=['Fuel Plus','Injection Clean','Diesel Plus','Valve Clean','AdBlue Additive','Spray Seal','Power Bond','Adheseal','Multi Clean','Easy Seal XS','Repaplast Repair','Repaplast Structure Coat','Total Power Grease','High Tef Oil','Fine Tef Oil','Unifix','Metal Weld','Thread Seal','Power Clean','Seal Fluid','Ultra Clean','Glass Clean Pro','Construction Primer','Zinc Coat','Multi Spray 1000'];
const seed=()=>({products:DEFAULT_PRODUCTS,tops:Object.fromEntries(COUNTRIES.map(c=>[c,[]])),revealed:false,open:true,maxChoices:10});
const respond=(data,status=200,headers={})=>({statusCode:status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers},body:JSON.stringify(data)});
const err=(message,status=400)=>respond({error:message},status);
const validAdmin=e=>{const pin=process.env.ADMIN_PIN;return !!pin && e.headers['x-admin-pin']===pin};
const iphashLimit=()=>{};
const normalize=a=>[...new Set(a.map(v=>String(v).trim()).filter(Boolean))];
const store=()=>getStore({name:'innotec-voting-v2',consistency:'strong'});
const config=async s=>await s.get('config',{type:'json'})||seed();
async function votes(s){let cursor;let keys=[];do{const p=await s.list({prefix:'vote/',paginate:true,cursor});keys.push(...p.blobs.map(x=>x.key));cursor=p.cursor;}while(cursor);const data=await Promise.all(keys.map(k=>s.get(k,{type:'json'})));return data.filter(v=>v&&COUNTRIES.includes(v.country)&&Array.isArray(v.products));}
const validTop=(top,products)=>Array.isArray(top)&&top.length===10&&new Set(top).size===10&&top.every(p=>products.includes(p));
export async function handler(event){
 try{
  const action=event.queryStringParameters?.action||'public';
  if(action==='health')return respond({ok:true,service:'innotec-product-challenge',message:'Netlify Function werkt'});
  const s=store();
  if(action==='qr'){
    const url=event.queryStringParameters?.url||'';
    if(!url.startsWith('https://')||url.length>500)return err('Ongeldige link');
    const svg=await QRCode.toString(url,{type:'svg',margin:1,color:{dark:'#101010',light:'#FFFFFF'}});
    return {statusCode:200,headers:{'Content-Type':'image/svg+xml','Cache-Control':'public, max-age=600'},body:svg};
  }
  if(action==='public'&&event.httpMethod==='GET'){
    const cfg=await config(s);
    return respond({products:cfg.products,open:cfg.open,maxChoices:cfg.maxChoices});
  }
  if(action==='submit'&&event.httpMethod==='POST'){
    const cfg=await config(s);if(!cfg.open)return err('De stemming is gesloten.',403);
    const b=JSON.parse(event.body||'{}');
    if(!COUNTRIES.includes(b.country))return err('Selecteer een geldig land.');
    if(!Array.isArray(b.products)||b.products.length!==cfg.maxChoices||new Set(b.products).size!==cfg.maxChoices||!b.products.every(p=>cfg.products.includes(p)))return err(`Selecteer exact ${cfg.maxChoices} verschillende producten.`);
    const id=crypto.randomUUID();
    await s.setJSON('vote/'+id,{country:b.country,products:b.products,createdAt:Date.now()});
    return respond({ok:true,receipt:id});
  }
  if(action==='admin'&&event.httpMethod==='GET'){
    if(!validAdmin(event))return err('Geen toegang. Controleer je ADMIN_PIN.',401);
    const cfg=await config(s);const vv=await votes(s);
    return respond({config:cfg,votes:vv.length,byCountry:Object.fromEntries(COUNTRIES.map(c=>[c,vv.filter(v=>v.country===c).length]))});
  }
  if(action==='save'&&event.httpMethod==='POST'){
    if(!validAdmin(event))return err('Geen toegang.',401);
    const b=JSON.parse(event.body||'{}');const old=await config(s);
    const products=normalize(b.products||[]);
    if(products.length<10||products.length>300)return err('Geef 10 tot 300 unieke producten op.');
    const tops={};for(const c of COUNTRIES){const t=normalize(b.tops?.[c]||[]);if(t.length!==0&&!validTop(t,products))return err(`${c}: geef exact 10 verschillende producten op, of laat leeg.`);tops[c]=t;}
    const cfg={...old,products,tops,open:!!b.open,revealed:!!b.revealed,maxChoices:10};await s.setJSON('config',cfg);return respond({ok:true});
  }
  if(action==='reset'&&event.httpMethod==='POST'){
    if(!validAdmin(event))return err('Geen toegang.',401);
    const page=await s.list({prefix:'vote/'});let cursor=page.cursor;let keys=page.blobs.map(x=>x.key);
    while(cursor){const p=await s.list({prefix:'vote/',cursor});keys.push(...p.blobs.map(x=>x.key));cursor=p.cursor;}
    await Promise.all(keys.map(k=>s.delete(k)));return respond({ok:true,deleted:keys.length});
  }
  if(action==='results'&&event.httpMethod==='GET'){
    const cfg=await config(s);const vv=await votes(s);
    const show=cfg.revealed||validAdmin(event);
    const counts={};for(const c of COUNTRIES){const cv=vv.filter(v=>v.country===c);counts[c]={total:cv.length,rows:show?(cfg.tops[c]||[]).map((p,i)=>({rank:i+1,product:p,count:cv.filter(v=>v.products.includes(p)).length})):[]};}
    return respond({revealed:cfg.revealed,open:cfg.open,ready:COUNTRIES.every(c=>cfg.tops[c]?.length===10),countries:counts,total:vv.length,show});
  }
  return err('Niet gevonden',404);
 }catch(e){console.error(e);return err('Serverfout: '+e.message,500);}
}
