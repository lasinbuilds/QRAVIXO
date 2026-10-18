const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const source = html.slice(html.indexOf('  var generation ='),html.indexOf('  var plateCounter ='));
const buttons = Object.fromEntries(['dlPng','dlSvg','dlJpg'].map(id=>[id,{disabled:true}]));
const pending = [];
const errors = [];
const container = {innerHTML:'',appendChild(){},querySelector(){return null;}};
let data='first', fits=true;
class QR {
  constructor(options){this.options=options;}
  getRawData(){return new Promise((resolve,reject)=>pending.push({resolve,reject}));}
  append(){container.innerHTML=this.options.data;}
}
const context = vm.createContext({
  document:{getElementById:id=>buttons[id],createElement:()=>({})},
  els:{qrContainer:container},currentData:()=>data,updateCapacityMeter:()=>fits,
  state:{size:720,dotStyle:'square',cornerStyle:'square',fg:'#000000',bg:'#ffffff',ecc:'M'},
  libReady:true,QRCodeStyling:QR,qrInstance:null,requestAnimationFrame:fn=>fn(),
  window:{QravixoMonitoring:{report:stage=>errors.push(stage)}}
});
vm.runInContext(source,context);
(async()=>{
  const first=context.generate(); pending.shift().resolve(); await first;
  assert(!buttons.dlPng.disabled);
  data=''; await context.generate(); assert.equal(context.qrInstance,null); assert(buttons.dlPng.disabled);
  data='too large';fits=false;await context.generate();assert.equal(context.qrInstance,null);assert(buttons.dlPng.disabled);
  fits=true;data='older';const older=context.generate();const old=pending.shift();
  data='newer';const newer=context.generate();const latest=pending.shift();
  latest.resolve();await newer;old.resolve();await older;assert.equal(context.qrInstance.options.data,'newer');
  data='failure';const failing=context.generate();pending.shift().reject(new Error('secret payload'));await failing;
  assert.equal(context.qrInstance,null);assert(buttons.dlPng.disabled);assert.deepEqual(errors,['render']);
  console.log('PASS: stale downloads, oversized input, asynchronous render races and render failure');
})().catch(error=>{console.error(error);process.exitCode=1;});
