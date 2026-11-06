const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/app.js','utf8');
const context=vm.createContext({Blob,TextEncoder,Uint8Array,Uint32Array,DataView});
vm.runInContext(source.slice(source.indexOf('const crcTable='),source.indexOf('async function download(')),context);
function decode(time,date){return [1980+(date>>9),(date>>5)&15,date&31,time>>11,(time>>5)&63,(time&31)*2]}
(async()=>{
 const originalTZ=process.env.TZ;
 try{
  for(const zone of ['UTC','Asia/Seoul','America/Los_Angeles']){
   process.env.TZ=zone;
   for(const [instant,expected] of [
    ['2026-11-05T16:23:45Z',[2026,11,6,1,23,44]],
    ['2026-12-31T15:00:01Z',[2027,1,1,0,0,0]],
    ['2024-02-28T15:00:00Z',[2024,2,29,0,0,0]]
   ]){
    context.instant=instant;
    const blob=await vm.runInContext("zip([{name:'한글.png',blob:new Blob(['image'])},{name:'second.png',blob:new Blob(['second'])}],new Date(instant))",context);
    const bytes=Buffer.from(await blob.arrayBuffer());
    const end=bytes.length-22,centralOffset=bytes.readUInt32LE(end+16);
    let local=0,central=centralOffset;
    for(let i=0;i<2;i++){
     assert.equal(bytes.readUInt32LE(local),0x04034b50);assert.equal(bytes.readUInt32LE(central),0x02014b50);
     assert.deepEqual(decode(bytes.readUInt16LE(local+10),bytes.readUInt16LE(local+12)),expected);
     assert.deepEqual(decode(bytes.readUInt16LE(central+12),bytes.readUInt16LE(central+14)),expected);
     const nameLength=bytes.readUInt16LE(local+26),extraLength=bytes.readUInt16LE(local+28);
     assert.equal(extraLength,9);const extra=local+30+nameLength;
     assert.equal(bytes.readUInt16LE(extra),0x5455);assert.equal(bytes[extra+4],1);
     assert.equal(bytes.readUInt32LE(extra+5),Date.parse(instant)/1000);
     const centralName=bytes.readUInt16LE(central+28),centralExtra=bytes.readUInt16LE(central+30);
     assert.deepEqual(bytes.subarray(extra,extra+9),bytes.subarray(central+46+centralName,central+46+centralName+centralExtra));
     assert.equal(bytes.readUInt32LE(central+42),local);
     local+=30+nameLength+extraLength+bytes.readUInt32LE(local+18);
     central+=46+centralName+centralExtra;
    }
    assert.equal(local,centralOffset);assert.equal(central,end);
   }
  }
 }finally{if(originalTZ===undefined)delete process.env.TZ;else process.env.TZ=originalTZ}
 console.log('PASS: ZIP local/central Korean timestamps, UTC extended timestamps, timezone independence, midnight/year/leap-day boundaries and entry offsets');
})().catch(error=>{console.error(error);process.exitCode=1});
