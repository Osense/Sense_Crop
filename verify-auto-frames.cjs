const fs=require('fs');let test=fs.readFileSync('verify-guides.cjs','utf8');
test+=`
function verifyTiling(){
  const b=JSON.parse(run('JSON.stringify(boxes)')),w=run('img.width'),h=run('img.height');
  let area=0;for(const r of b){assert(r.w>0&&r.h>0);assert(r.x>=0&&r.y>=0&&r.x+r.w<=w+1e-7&&r.y+r.h<=h+1e-7);area+=r.w*r.h}
  assert(Math.abs(area-w*h)<1e-6);
  for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){const x=Math.min(b[i].x+b[i].w,b[j].x+b[j].w)-Math.max(b[i].x,b[j].x),y=Math.min(b[i].y+b[i].h,b[j].y+b[j].h)-Math.max(b[i].y,b[j].y);assert(x<1e-7||y<1e-7)}
}
run("resetGrid();addGuide('v');addGuide('h')");verifyTiling();assert.equal(run('boxes[0].w'),1200);assert.equal(run('boxes[0].h'),1540);
for(let i=0;i<5;i++){run("addGuide('v');addGuide('h')");verifyTiling()}
run("vertical[1]=vertical[0];syncGuideBoxes()");verifyTiling();
run("$('cols').value=3;$('rows').value=4;$('grid').onclick()");verifyTiling();assert.equal(run('boxes[0].w'),400);assert.equal(run('boxes[0].h'),385);
vm.runInContext(fs.readFileSync('dist/dimensions.js','utf8'),context);
run("$('cw').value=200;$('cw').oninput()");assert.equal(run('guideAutoSize'),false);assert.equal(run('boxes[0].w'),200);
run("addGuide('v')");assert.equal(run('guideAutoSize'),true);verifyTiling();run("$('undo').onclick()");assert.equal(run('guideAutoSize'),false);assert.equal(run('boxes[0].w'),200);
console.log('PASS: one-cell coverage, gap-free nonoverlapping additions, coincident guides, exact 3x4 tiling, manual resizing, automatic sizing on addition, undo');
`;
test=test.replace('children:[{},{}],insertBefore(){}','children:[{},{}],insertBefore(){},append(){},remove(){}');
new Function('require',test)(require);
