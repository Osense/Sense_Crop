const fs=require('fs'),vm=require('vm'),assert=require('assert');
const nodes={};function el(){return {value:'',style:{},children:[],classList:{toggle(){}},append(...items){this.children.push(...items)},replaceChildren(){this.children=[]},insertBefore(){},before(){},after(){},setAttribute(){},addEventListener(){},querySelectorAll(){return []},closest(){return {children:[{},{}],insertBefore(){}}},getContext(){return {drawImage(){},fillRect(){}}}}}
function node(id){if(!nodes[id]){nodes[id]=el();nodes[id].value=({prefix:'test',start:1,format:'png',fit:'contain',bg:'transparent',ow:360,oh:360,gw:360,gh:360,cols:3,rows:4}[id]??1)}return nodes[id]}
const context={console,Blob,TextEncoder,Uint32Array,Uint8Array,DataView,setTimeout:()=>0,clearTimeout(){},setInterval(){},clearInterval(){},document:{getElementById:node,createElement:el,body:el(),addEventListener(){},querySelector:el},window:{addEventListener(){}}};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),context);vm.runInContext(fs.readFileSync('dist/guides.js','utf8'),context);
function run(code){return vm.runInContext(code,context)}
run("guideAutoSize=false;img={width:1200,height:1540};previews=()=>{};vertical=[20,600,1180];horizontal=[20,500,1000,1520];syncGuideBoxes()");assert.equal(run('boxes.length'),12);assert.equal(run('boxes[0].x+boxes[0].w/2'),20);assert.equal(run('boxes[0].y+boxes[0].h/2'),20);assert.equal(run('boxes[0].x'),-160);
run("$('ratio').value=0;$('gw').value=240;$('gh').value=180;syncDimensions('w')");assert.equal(run('boxes[0].w'),240);assert.equal(run('boxes[0].h'),180);run('vertical[1]=640;syncGuideBoxes()');assert.equal(run('boxes[1].x+boxes[1].w/2'),640);assert.equal(run('boxes[4].x+boxes[4].w/2'),640);
run("snapshot();vertical[0]=100;syncGuideBoxes();$('undo').onclick()");assert.equal(run('vertical[0]'),20);
run("$('cropMode').value='free';$('cropMode').onchange();boxes=[{x:5,y:10,w:20,h:30}];$('cropMode').value='guide';$('cropMode').onchange();$('cropMode').value='free';$('cropMode').onchange()");assert.equal(run('boxes[0].x'),5);assert.equal(run('boxes[0].w'),20);
run("$('cropMode').value='guide';$('cropMode').onchange();$('cols').value=5;$('rows').value=5;$('grid').onclick()");assert.equal(run('boxes.length'),25);assert.equal(run('vertical.length'),5);assert.equal(run('horizontal.length'),5);run("$('clear').onclick();$('undo').onclick()");assert.equal(run('boxes.length'),25);console.log('PASS: intersections, edge centers, independent dimensions, linked movement, undo, separate modes, 25 frames');

run("resetGrid();addGuide('v');addGuide('h')");assert.equal(run('vertical[0]'),600);assert.equal(run('horizontal[0]'),770);
run("addGuide('v');addGuide('h')");assert.equal(run('JSON.stringify(vertical)'),JSON.stringify([400,800]));assert(Math.abs(run('horizontal[0]')-1540/3)<1e-9);assert(Math.abs(run('horizontal[1]')-3080/3)<1e-9);
run("vertical[0]=15;addGuide('v')");assert.equal(run('JSON.stringify(vertical)'),JSON.stringify([300,600,900]));
run("freeFrames=[{x:10,y:10,w:20,h:20}];resetGrid()");assert.equal(run('vertical.length+horizontal.length+boxes.length+freeFrames.length'),0);
run("$('undo').onclick()");assert.equal(run('vertical.length'),3);assert.equal(run('horizontal.length'),2);assert.equal(run('freeFrames.length'),1);
console.log('PASS: midpoint, thirds, redistribution after drag, full grid reset, reset undo');
