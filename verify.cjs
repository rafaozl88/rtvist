const fs=require('fs'),vm=require('vm'),assert=require('assert');
let s=fs.readFileSync('index.html','utf8').replace(/\r\n/g,'\n');
for(const m of s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) new vm.Script(m[1]);
const fn=s.slice(s.indexOf('async function fbSalvarVeiculo('),s.indexOf('async function fbExcluirVeiculo('));
let saved;
const ctx={Date,Promise,comprimirImagem:async x=>x,storage:{ref:()=>({putString:async()=>{},getDownloadURL:async()=> 'https://foto'})},fsdb:{collection:()=>({doc:()=>({set:async x=>{saved=x;}})})}};
vm.createContext(ctx);vm.runInContext(fn,ctx);
(async()=>{await ctx.fbSalvarVeiculo({nome:'TUCSON',motor:'G4GC',chassi:'9BH123',fotos:[{nome:'motor.jpg',data:'data:image/jpeg;base64,AA',_rot:90}]});assert.equal(saved.motor,'G4GC');assert.equal(saved.chassi,'9BH123');assert.equal(saved.fotos[0]._rot,90);await ctx.fbSalvarVeiculo({_id:'1',nome:'YBR',motor:'E381E',chassi:'9C6',fotos:[{nome:'foto',url:'https://foto',_rot:270}]});assert.equal(saved.fotos[0]._rot,270); console.log('PASS: sintaxe e persistência de motor, chassi e rotação (fotos novas e existentes).');})().catch(e=>{console.error(e);process.exitCode=1;});
