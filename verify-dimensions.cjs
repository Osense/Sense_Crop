const fs=require('fs');let test=fs.readFileSync('verify-guides.cjs','utf8');
test=test.replace('children:[{},{}],insertBefore(){}','children:[{},{}],insertBefore(){},append(){},remove(){}');
test+=`
vm.runInContext(fs.readFileSync('dist/dimensions.js','utf8'),context);
run("$('ratio').value=0;$('cw').value=480;$('cw').oninput();$('ch').value=260;$('ch').oninput()");
assert.equal(run('Number($(\"gw\").value)'),480);assert.equal(run('boxes[0].w'),480);assert.equal(run('boxes[0].h'),260);
run("$('gw').value=320;$('gw').oninput()");assert.equal(run('Number($(\"cw\").value)'),320);assert.equal(run('boxes[0].w'),320);
run("$('cropMode').value='free';$('cropMode').onchange();selected=0;boxes=[{x:200,y:200,w:200,h:200}];render(false);$('cw').value=400;$('cw').oninput()");
assert.equal(run('boxes[0].w'),400);assert.equal(run('boxes[0].x+boxes[0].w/2'),300);
run("$('ratio').value=1;$('gh').value=180;$('gh').oninput()");assert.equal(run('boxes[0].w'),180);assert.equal(run('boxes[0].h'),180);assert.equal(run('Number($(\"cw\").value)'),180);
run("$('cw').value='';$('cw').onchange()");assert.equal(run('Number($(\"cw\").value)'),10);
console.log('PASS: number/slider synchronization, guide updates, selected free-frame resize, ratio lock, empty input');
`;
new Function('require',test)(require);
