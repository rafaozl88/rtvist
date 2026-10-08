const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync('index.html','utf8');
const start=source.indexOf('(async()=>{',source.indexOf('// ─── INIT'));
const end=source.indexOf('})();',start)+5;
async function test(denied) {
  const elements={}; let callback;
  const ctx={document:{getElementById:id=>elements[id] ||= {style:{},textContent:''}},
    console:{error:()=>{}},usuarios:[],dbReady:false,
    fbCarregarUsuarios:async()=>{if(denied) throw Error('Missing or insufficient permissions');},
    fbCarregarVeiculos:async()=>{},atualizarStats:()=>{},renderResults:()=>{},renderCadastrosList:()=>{},renderUsuarios:()=>{},
    atualizarPermissaoEdicao:()=>{},localStorage:{getItem:()=>null},auth:{onAuthStateChanged:fn=>callback=fn}};
  vm.createContext(ctx);
  await vm.runInContext(source.slice(start,end),ctx);
  assert.equal(elements['loading-screen'].style.display,'none');
  assert.equal(elements['login-screen'].style.display,'flex');
  await callback(null);
  assert.equal(elements['loading-screen'].style.display,'none');
  assert.equal(elements['login-screen'].style.display,'flex');
  if(denied) assert.match(elements['login-msg'].textContent,/Firestore/);
}
(async()=>{await test(true);await test(false);console.log('PASS: login visível com leituras permitidas ou negadas; erro de sessão tratado.');})().catch(e=>{console.error(e);process.exitCode=1;});
