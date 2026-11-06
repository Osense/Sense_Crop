const fs=require('fs');let test=new Function('require',fs.readFileSync('verify-rotation.cjs','utf8').replace("new Function('require',test)(require);",'return test;'))(require);
// Reuse the app/guide/rotation harness and add the new correction layer.
test+=`
context.document.createElementNS=()=>context.document.createElement('svg');
context.rotateBar=context.document.createElement('div');context.handMode=false;
vm.runInContext(fs.readFileSync('dist/correction-math.js','utf8'),context);
vm.runInContext(fs.readFileSync('dist/correction.js','utf8'),context);
run("img={width:800,height:1000};render(false);vertical=[200,600];horizontal=[300,700];syncGuideBoxes();history=[]");
const initial=run('JSON.stringify(guideState())');
const oldCreate=context.document.createElement;context.document.createElement=()=>{const el=oldCreate();const base=el.getContext();base.getImageData=()=>({data:new Uint8ClampedArray(800*1000*4)});base.putImageData=()=>{};el.getContext=()=>base;return el};
const canvasCtx=run('rotationCanvas.getContext(\"2d\")');canvasCtx.getImageData=()=>({data:new Uint8ClampedArray(800*1000*4)});context.savedCanvasCtx=canvasCtx;run('rotationCanvas.getContext=()=>savedCanvasCtx');
context.ImageData=class{constructor(data,width,height){this.data=data;this.width=width;this.height=height}};
context.Uint8ClampedArray=Uint8ClampedArray;context.Worker=class{postMessage(p){this.onmessage({data:{w:p.w,h:p.h,buffer:new ArrayBuffer(p.w*p.h*4)}})}terminate(){}};
run("correctionMode='four';correctionLines=[{a:{x:80,y:80},b:{x:700,y:120}},{a:{x:80,y:900},b:{x:700,y:900}},{a:{x:80,y:80},b:{x:80,y:900}},{a:{x:700,y:120},b:{x:700,y:900}}]");
(async()=>{
await run('applyCorrection()');assert.equal(run('correctionSourceId'),1);assert.equal(run('rotationAngle'),0);assert.equal(run('correctionBusy'),false);assert.equal(run('history.length'),1);assert.equal(run('boxes.length'),4);
run("$('undo').onclick()");assert.equal(run('JSON.stringify(guideState())'),initial);assert.equal(run('rotationCanvas.width'),800);assert.equal(run('rotationCanvas.height'),1000);
run("correctionMode='one';correctionLines=[{a:{x:100,y:100},b:{x:500,y:140}}]");await run('applyCorrection()');assert.equal(run('rotationAngle'),-5.7);assert.equal(run('correctionMode'),'');run("$('undo').onclick()");assert.equal(run('rotationAngle'),0);
run("correctionMode='four';correctionLines=[]");await run('applyCorrection()');assert.equal(run('correctionBusy'),false);assert.equal(run('history.length'),0);
console.log('PASS: correction source snapshots, projective apply, one-step undo with exact crop restore, single-line rotation, invalid-state recovery');
})().catch(e=>{console.error(e);process.exitCode=1});
`;
new Function('require',test)(require);
