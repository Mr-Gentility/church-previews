// Usage (from a folder containing v/index.html, v/data.json, tools/mock.html):
//   node tools/render.js slug1 slug2 ...   -> writes v/<slug>.jpg (laptop + phone mockup)
const { chromium } = require('playwright');const fs=require('fs');const path=require('path');
const R=path.resolve(__dirname,'..');const want=process.argv.slice(2);
(async()=>{const data=JSON.parse(fs.readFileSync(R+'/v/data.json')).filter(c=>!want.length||want.includes(c.slug));
const tpl=fs.readFileSync(R+'/v/index.html','utf8');const exe=fs.existsSync('/opt/pw-browsers/chromium')?{executablePath:'/opt/pw-browsers/chromium'}:{};
let b;try{b=await chromium.launch()}catch(e){b=await chromium.launch(exe)}
const hide='.ribbon{display:none!important}.float-give{display:none!important}.claim-bar{display:none!important}';const errs=[];
for(const C of data){
  const html=tpl.replace('<script>\n/* ---------- load','<script>window.__DATA='+JSON.stringify(C)+';</script>\n<script>\n/* ---------- load');
  fs.writeFileSync('/tmp/_r.html',html);
  const d=await b.newPage({viewport:{width:1440,height:900}});d.on('pageerror',e=>errs.push(C.slug+': '+e.message));await d.goto('file:///tmp/_r.html');await d.addStyleTag({content:hide});await d.waitForTimeout(1500);await d.screenshot({path:'/tmp/_d.png'});
  const t=await d.evaluate(()=>document.querySelector('.brand b').innerText+' | '+document.title);await d.close();
  const m=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});await m.goto('file:///tmp/_r.html');await m.addStyleTag({content:hide});await m.waitForTimeout(1500);await m.screenshot({path:'/tmp/_m.png'});await m.close();
  fs.writeFileSync('/tmp/_mock.html',fs.readFileSync(R+'/tools/mock.html','utf8').replace('/home/claude/m_desk.png','/tmp/_d.png').replace('/home/claude/m_mob.png','/tmp/_m.png'));
  const p=await b.newPage({viewport:{width:1200,height:720},deviceScaleFactor:1});await p.goto('file:///tmp/_mock.html');await p.waitForTimeout(400);
  await p.screenshot({path:R+'/v/'+C.slug+'.jpg',type:'jpeg',quality:82});await p.close();console.log(C.slug,'->',t);
}
console.log('errors',errs);await b.close();})();
