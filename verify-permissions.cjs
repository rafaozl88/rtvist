const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const source = fs.readFileSync('index.html', 'utf8');
const button = {style:{}};
let removed = 0;
const context = {
  usuarioAtual:null, ADMIN_USER:'rtmaster', showToast:()=>{},
  MASTER_UID:'N4PXpla04LX9Lpip4NsSk8ESYGL2',
  auth:{currentUser:{uid:'N4PXpla04LX9Lpip4NsSk8ESYGL2'}},
  document:{getElementById:id=>id==='btn-editar-veiculo'?button:{remove:()=>removed++}}
};
vm.createContext(context);
vm.runInContext(source.slice(source.indexOf('function podeEditarVeiculos()'),source.indexOf('// ─── SAVE / LOAD')),context);
for (const [user, allowed] of [
  [null,false], [{usuario:'assinante',nivel:'usuario'},false],
  [{usuario:'outro-admin',nivel:'admin'},false],
  [{usuario:'rtmaster',nivel:'usuario'},false],
  [{usuario:'rtmaster',nivel:'admin'},true]
]) {
  context.usuarioAtual=user;
  assert.equal(context.podeEditarVeiculos(),allowed);
  context.atualizarPermissaoEdicao();
  assert.equal(button.style.display,allowed?'':'none');
  assert.equal(context.exigirMasterVeiculos(),allowed);
}
assert.equal(removed,4);
context.usuarioAtual={usuario:'rtmaster',nivel:'admin'};
context.auth.currentUser=null;
assert.equal(context.podeEditarVeiculos(),false);
context.atualizarPermissaoEdicao();
assert.equal(button.style.display,'none');
context.auth.currentUser={uid:'outro-uid'};
assert.equal(context.podeEditarVeiculos(),false);
context.atualizarPermissaoEdicao();
assert.equal(button.style.display,'none');
context.usuarioAtual={usuario:'assinante',nivel:'usuario'};
const save=source.slice(source.indexOf('async function fbSalvarVeiculo('),source.indexOf('// USUÁRIOS'));
vm.runInContext(save,context);
(async()=>{
  await assert.rejects(context.fbSalvarVeiculo({}),/Somente o Master/);
  await assert.rejects(context.fbExcluirVeiculo('1'),/Somente o Master/);
  for(const name of ['abrirEdicao','editFotoGirar','editFotoExcluir','salvarEdicao','salvarCadastro','excluir','confirmarImport']) {
    const pattern=new RegExp(`(?:async )?function ${name}\\([^)]*\\)\\s*\\{\\s*if \\(!exigirMasterVeiculos\\(\\)\\) return;`);
    assert.match(source,pattern);
  }
  console.log('PASS: Master autorizado; assinantes, outros admins e sessões sem login bloqueados; botão e gravação protegidos.');
})().catch(error=>{console.error(error);process.exitCode=1;});
