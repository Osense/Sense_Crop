const fs=require('fs');let test=fs.readFileSync('verify-guides.cjs','utf8');
test=test.replace('before(){}','before(){},after(){}');
test=test.replace('children:[{},{}],insertBefore(){}','children:[{},{}],insertBefore(){},append(){},remove(){}');
test=test.replace('drawImage(){},fillRect(){}','drawImage(...a){rotationCalls.push(a)},fillRect(){},clearRect(){},save(){},restore(){},translate(){},rotate(a){rotationAngles.push(a)}');
test='const rotationCalls=[],rotationAngles=[];\n'+test;
test+=`
context.requestAnimationFrame=fn=>{fn();return 1};context.cancelAnimationFrame=()=>{};
vm.runInContext(fs.readFileSync('dist/dimensions.js','utf8'),context);
run('guideAutoSize=false;syncGuideBoxes()');
vm.runInContext(fs.readFileSync('dist/rotation.js','utf8'),context);
assert(run('img===rotationCanvas'));assert.equal(run('rotationCanvas.width'),1200);assert.equal(run('rotationCanvas.height'),1540);
const prior=JSON.parse(run('JSON.stringify(boxes)'));run('setRotation(1.2)');assert.equal(run('rotationAngle'),1.2);assert(run('rotationCanvas.width')>1200);assert(run('rotationCanvas.height')>1540);assert.equal(run('boxes[0].w'),prior[0].w);assert.equal(run('boxes[0].h'),prior[0].h);assert.equal(run('boxes[0].x'),prior[0].x+(run('rotationCanvas.width')-1200)/2);assert.equal(run('boxes[0].y'),prior[0].y+(run('rotationCanvas.height')-1540)/2);assert(Math.abs(rotationAngles.at(-1)-1.2*Math.PI/180)<1e-10);assert.equal(rotationCalls.at(-1)[1],-600);assert.equal(rotationCalls.at(-1)[2],-770);
const beforeUndo=run('JSON.stringify(boxes)');run("$('rotatePlus').onclick()");assert.equal(run('rotationAngle'),1.3);run("$('undo').onclick()");assert.equal(run('rotationAngle'),1.2);assert.equal(run('JSON.stringify(boxes)'),beforeUndo);
run("$('rotationNumber').value=-2.4;$('rotationNumber').oninput()");assert.equal(run('rotationAngle'),-2.4);assert.equal(run('Number($(\"rotationRange\").value)'),-2.4);
run("$('rotationReset').onclick()");assert.equal(run('rotationAngle'),0);run('setRotation(999)');assert.equal(run('rotationAngle'),180);
for(const angle of [0,1.2,-2.4,45,90,-90,180]){run('setRotation('+angle+')');const w=run('rotationCanvas.width'),h=run('rotationCanvas.height'),r=angle*Math.PI/180;for(const x of [-600,600])for(const y of [-770,770]){const rx=x*Math.cos(r)-y*Math.sin(r)+w/2,ry=x*Math.sin(r)+y*Math.cos(r)+h/2;assert(rx>=-1e-7&&rx<=w+1e-7);assert(ry>=-1e-7&&ry<=h+1e-7)}if(Math.abs(angle)===90){assert.equal(w,1540);assert.equal(h,1200)}}
run('setRotation(0)');assert.equal(run('rotationCanvas.width'),1200);assert.equal(run('rotationCanvas.height'),1540);
run("$('cropMode').value='free';$('cropMode').onchange();boxes=[{x:100,y:200,w:200,h:100}];snapshot();setRotation(45);$('undo').onclick()");assert.equal(run('boxes[0].x'),100);assert.equal(run('boxes[0].y'),200);
run('img={width:800,height:1000};render(false)');assert.equal(run('rotationAngle'),0);assert.equal(run('rotationCanvas.width'),800);assert.equal(run('rotationCanvas.height'),1000);
run('crop(boxes[0],360,360)');assert.equal(rotationCalls.at(-1)[0],run('rotationCanvas'));
console.log('PASS: original-source rotation, pixel dimensions, expanded bounds, all corners inside canvas, frame translation, angle synchronization, fine steps, undo, reset, export source');
`;
new Function('require',test)(require);
