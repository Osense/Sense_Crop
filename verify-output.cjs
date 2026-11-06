const fs=require('fs');let test=fs.readFileSync('verify-guides.cjs','utf8');
test=test.replace('drawImage(){},fillRect(){}','drawImage(){},fillRect(){}');
test+=`
context.setTimeout=fn=>{fn();return 0};
run("$('outputMode').value='scale';$('outputScale').value='2';boxes=[{x:0,y:0,w:480,h:240},{x:500,y:500,w:300,h:450}];selected=0");
assert.equal(run('JSON.stringify(getOutputSize(boxes[0]))'),JSON.stringify({w:960,h:480}));assert.equal(run('JSON.stringify(getOutputSize(boxes[1]))'),JSON.stringify({w:600,h:900}));
run("$('outputScale').value='.5'");assert.equal(run('JSON.stringify(getOutputSize(boxes[0]))'),JSON.stringify({w:240,h:120}));
run("$('outputScale').value='custom';$('scaleFactor').value=2.5");assert.equal(run('JSON.stringify(getOutputSize(boxes[0]))'),JSON.stringify({w:1200,h:600}));
run("$('outputMode').value='custom';$('outputLinked').checked=true;$('outputMode').onchange();$('ow').value=1000;$('ow').oninput()");assert.equal(run('Number($('+'\"oh\"'+').value)'),500);
assert.equal(run('JSON.stringify(getOutputSize(boxes[1]))'),JSON.stringify({w:1000,h:1500}));
run("$('oh').value=300;$('oh').oninput()");assert.equal(run('Number($('+'\"ow\"'+').value)'),600);
run("$('outputLinked').checked=false;$('outputLinked').onchange();$('ow').value=777;$('ow').oninput();$('oh').value=333;$('oh').oninput()");assert.equal(run('JSON.stringify(getOutputSize(boxes[0]))'),JSON.stringify({w:777,h:333}));assert.equal(run('JSON.stringify(getOutputSize(boxes[1]))'),JSON.stringify({w:777,h:333}));
assert.throws(()=>run('checkOutputSize(20000,1000)'));assert.throws(()=>run('checkOutputSize(9000,9000)'));
run("$('outputMode').value='scale';$('outputScale').value='2'");
const originalCreate=context.document.createElement;context.document.createElement=()=>{const c=originalCreate();c.toBlob=fn=>fn(new Blob([JSON.stringify({w:c.width,h:c.height})],{type:'image/png'}));return c};
(async()=>{const files=await run('exportBlobs()');assert.equal(files.length,2);assert.deepEqual(JSON.parse(await files[0].blob.text()),{w:960,h:480});assert.deepEqual(JSON.parse(await files[1].blob.text()),{w:600,h:900});let captured;context.capture=(blob)=>{captured=blob};run('save=(blob)=>capture(blob)');await run('saveOne(1)');assert.deepEqual(JSON.parse(await captured.text()),{w:600,h:900});console.log('PASS: per-frame 2x, downscale, arbitrary scale, linked resolution in both directions, unlinked size, output limits, batch and single export dimensions')})().catch(e=>{console.error(e);process.exitCode=1});
`;
new Function('require',test)(require);
