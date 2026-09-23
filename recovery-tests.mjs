/* Focused regression checks for completion of the interrupted 2.7.18 release.
   Run with node --test recovery-tests.mjs. No packages or network required. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
const source = name => fs.readFileSync(new URL(name, import.meta.url), 'utf8');
const engine = source('engine.js'), workspace = source('workspace.js');
function functionCode(code, name) {
  const start = code.search(new RegExp('^  (?:async )?function ' + name + '\\(', 'm'));
  assert.ok(start >= 0, name);
  const end = code.indexOf('\n  }', start);
  return code.slice(start, end + 4);
}

test('asset artwork scales with zoom, follows geometry rotation, preserves zero opacity', () => {
  let scale = 1;
  const context = vm.createContext({
    state: { map: { project: ([x,y]) => ({ x:x*scale, y:y*scale,
      distanceTo(p) { return Math.hypot(this.x-p.x, this.y-p.y); } }) } },
    latlng: c => c, L: { divIcon: options => options },
    assetIconSVG: () => '<svg viewBox="0 0 64 64"></svg>',
  });
  vm.runInContext(functionCode(engine, 'assetIllustrationIcon'), context);
  const f = {geometry:{type:'Polygon',coordinates:[[[0,0],[0,-16],[3,-16],[3,0],[0,0]]]},properties:{kind:'artic'}};
  const icon = context.assetIllustrationIcon(f);
  assert.deepEqual([...icon.iconSize], [16,3]);
  assert.deepEqual([...icon.iconAnchor], [8,1.5]);
  assert.match(icon.html, /rotate\(-90deg\)/);
  assert.match(icon.html, /opacity:1/);
  scale = 2;
  f.properties.styleFillOpacity = 0;
  const zoomed = context.assetIllustrationIcon(f);
  assert.deepEqual([...zoomed.iconSize], [32,6]);
  assert.match(zoomed.html, /opacity:0/);
  f.geometry.coordinates[0] = [[0,0],[16,0],[16,3],[0,3],[0,0]];
  assert.match(context.assetIllustrationIcon(f).html, /rotate\(0deg\)/);
  f.geometry.coordinates[0] = [[0,0],[0,0],[0,0],[0,0]];
  assert.equal(context.assetIllustrationIcon(f), null);
});

test('native map taps reposition the cursor after suppression expires without adding points', () => {
  const positions = []; let baseClicks = 0;
  const context = vm.createContext({S:{suppressMapClick:0}, ui:{precision:{active:true,multi:false}},
    performance:{now:()=>1000}, precisionMapRect:()=>({left:20,top:80}),
    positionPrecisionCursor:(...p)=>positions.push(p), base:{onMapClick:()=>baseClicks++}});
  vm.runInContext(functionCode(workspace, 'onMapClick'), context);
  const tap = {originalEvent:{clientX:220,clientY:380}};
  context.onMapClick(tap);
  assert.deepEqual(positions[0].slice(0,2), [200,300]);
  context.S.suppressMapClick = 1100;
  context.onMapClick(tap); assert.equal(positions.length,1);
  context.S.suppressMapClick = 0;
  context.onMapClick(tap); assert.equal(positions.length,2);
  assert.equal(baseClicks,0);
});

test('service checkbox changes commit visibility without fetching', () => {
  const elements = ['ohl','gas','water'].map(service=>({dataset:{service},checked:true}));
  let commits=0, requests=0;
  const context = vm.createContext({k:'services', $$:()=>elements,
    S:{project:{serviceVisibility:{}}}, C:{commit:()=>commits++,runAction:()=>requests++}});
  const start=workspace.indexOf('    if (k === "services")\n');
  const end=workspace.indexOf('    if (k === "routeToSite")',start);
  vm.runInContext(workspace.slice(start,end),context);
  elements.forEach(el=>el.onchange());
  elements[0].checked=false; elements[0].onchange();
  assert.equal(commits,4); assert.equal(requests,0);
  assert.equal(context.S.project.serviceVisibility.ohl,false);
  assert.equal(context.S.project.serviceVisibility.water,true);
});

test('repeated Show / Refresh taps start only one request and release the guard on completion', async () => {
  let complete, requests=0;
  const waiting = new Promise(resolve=>complete=resolve);
  const context = vm.createContext({
    state:{project:{area:{},hiddenTypes:[],serviceVisibility:{ohl:true}},map:{fitBounds(){}}},
    SERVICES:{ohl:{}},toast(){},commit(){},openDrawer(){},
    refreshOhlSnapshot:()=>{requests++;return waiting;}, ohlSearchBounds:()=>null,
  });
  vm.runInContext('let serviceMappingInFlight=false;\n'+functionCode(engine,'showSelectedServiceMapping'),context);
  const first = context.showSelectedServiceMapping();
  await context.showSelectedServiceMapping(); assert.equal(requests,1);
  complete(); await first;
  await context.showSelectedServiceMapping(); assert.equal(requests,2);
});

test('browser entry persists the choice, removes the gate, and works when storage is denied', () => {
  const cinema=source('cinema.js');
  const start=cinema.indexOf('    if (continueBrowser) continueBrowser.onclick = () => {');
  const end=cinema.indexOf('\n    const why',start);
  for(const denied of [false,true]) {
    let entered=0, stored=null, removed=[];
    const context=vm.createContext({continueBrowser:{},
      localStorage:{setItem:(k,v)=>{if(denied)throw Error('Denied'); stored=[k,v];}},
      document:{documentElement:{classList:{remove:(...classes)=>removed.push(...classes)}}},
      enter:()=>entered++});
    vm.runInContext(cinema.slice(start,end),context);
    context.continueBrowser.onclick();
    assert.equal(entered,1); assert.ok(removed.includes('install-required'));
    if(!denied)assert.deepEqual(stored,['sami.browser.allowed','yes']);
  }
});

test('generated worker uses a content revision matching every current critical shell file', () => {
  const manifest=JSON.parse(source('ASSET_MANIFEST.json'));
  const hash=createHash('sha256');
  for(const name of manifest.shell)hash.update(name).update(fs.readFileSync(new URL(name,import.meta.url)));
  const revision=hash.digest('hex').slice(0,12);
  assert.ok(source('sw.js').includes('const REVISION = "'+revision+'"'));
});

test('recovered worker installs into a separate cache and returns repaired assets offline', async () => {
  const listeners={}, stores=new Map(); let offline=false;
  const getStore=name=>{
    if(!stores.has(name))stores.set(name,new Map());
    const data=stores.get(name);
    return {put:async(k,v)=>data.set(typeof k==='string'?k:k.url,v.clone()),
      match:async k=>data.get(typeof k==='string'?k:k.url)?.clone(),
      keys:async()=>[...data.keys()],delete:async k=>data.delete(k)};
  };
  const oldName='sami-production-v2.7.18';
  await getStore(oldName).put('https://example.test/SAMI-Pro/engine.js',new Response('old engine'));
  getStore('sami-media-v1');
  const context=vm.createContext({URL,Request,Response,Headers,AbortController,setTimeout,clearTimeout,
    caches:{open:async name=>getStore(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)},
    self:{location:{href:'https://example.test/SAMI-Pro/sw.js'},registration:{update:async()=>{}},clients:{claim:async()=>{}},
      addEventListener:(name,fn)=>listeners[name]=fn},
    fetch:async()=>{if(offline)throw Error('Offline');return new Response('repaired shell',{headers:{'content-type':'application/javascript'}});}});
  vm.runInContext(source('sw.js'),context);
  let task;
  listeners.install({waitUntil:p=>task=p}); await task;
  assert.ok(stores.has(oldName),'old running app cache survives installation');
  assert.equal([...stores.keys()].filter(k=>k.startsWith(oldName)).length,2);
  offline=true;
  const request=new Request('https://example.test/SAMI-Pro/engine.js?v=2.7.18');
  const response=await context.shell(request,new URL(request.url));
  assert.equal(await response.text(),'repaired shell');
  listeners.activate({waitUntil:p=>task=p});await task;
  assert.ok(!stores.has(oldName));assert.ok(stores.has('sami-media-v1'));
});


test('Undo/Redo live in the map toolbar, never in the menu header', () => {
  const html=source('index.html');
  const header=html.slice(html.indexOf('<header'),html.indexOf('</header>'));
  assert.ok(!header.includes('id="undoBtn"'));
  assert.ok(!header.includes('id="redoBtn"'));
  assert.ok(header.includes('id="menuButton"'));
  const toolbar=html.slice(html.indexOf('<div class="canvas-toolbar">'),html.indexOf('<div class="area-chip">'));
  assert.ok(toolbar.includes('id="mapHistory"'));
  assert.ok(toolbar.includes('id="undoBtn"'));
  assert.ok(toolbar.includes('id="redoBtn"'));
});
