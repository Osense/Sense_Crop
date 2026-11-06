let rotationAngle=0,rotationOriginal=null,rotationPreviewTimer=null,rotationFrame=0;
const rotationCanvas=document.createElement('canvas');rotationCanvas.id='rotationCanvas';rotationCanvas.hidden=true;$('source').before(rotationCanvas);
const rotationControls=document.createElement('div');rotationControls.className='rotation-controls';rotationControls.innerHTML=`<div class="divider"></div><h2>스캔 기울기 보정</h2><label>회전 각도 · °<input id="rotationNumber" type="number" min="-180" max="180" step="0.1" value="0"><input id="rotationRange" aria-label="회전 각도 슬라이더" type="range" min="-10" max="10" step="0.1" value="0"></label><div class="rotation-buttons"><button id="rotateMinus">−0.1°</button><button id="rotatePlus">＋0.1°</button><button id="rotationReset">초기화</button></div><p class="hint">＋는 시계 방향, −는 반시계 방향입니다. 회전한 이미지 전체가 들어오도록 캔버스가 자동 확장됩니다.</p>`;$('info').after(rotationControls);
function normalizedAngle(value){return Math.round(Math.max(-180,Math.min(180,Number(value)||0))*10)/10}
function rotationFields(){const range=$('rotationRange');range.min=Math.min(-10,rotationAngle);range.max=Math.max(10,rotationAngle);range.value=$('rotationNumber').value=rotationAngle}
function rotationSize(angle){const r=angle*Math.PI/180,c=Math.abs(Math.cos(r)),s=Math.abs(Math.sin(r));return {w:Math.ceil(rotationOriginal.width*c+rotationOriginal.height*s-1e-8),h:Math.ceil(rotationOriginal.width*s+rotationOriginal.height*c-1e-8)}}
function paintRotation(){
  if(!rotationOriginal)return;
  const c=rotationCanvas,{w,h}=rotationSize(rotationAngle);c.width=w;c.height=h;
  const ctx=c.getContext('2d');ctx.clearRect(0,0,w,h);ctx.save();ctx.translate(w/2,h/2);ctx.rotate(rotationAngle*Math.PI/180);ctx.drawImage(rotationOriginal,-rotationOriginal.width/2,-rotationOriginal.height/2);ctx.restore();img=c;
}
function setRotation(value,updatePreview=true,moveFrames=true){
  const before=img?{w:img.width,h:img.height}:null;rotationAngle=normalizedAngle(value);rotationFields();paintRotation();
  if(!img)return;
  if(moveFrames&&before){const dx=(img.width-before.w)/2,dy=(img.height-before.h)/2;
    vertical=vertical.map(x=>x+dx);horizontal=horizontal.map(y=>y+dy);
    freeFrames=freeFrames.map(b=>({...b,x:b.x+dx,y:b.y+dy}));
    if(cropMode==='guide')syncGuideBoxes();else boxes=boxes.map(b=>({...b,x:b.x+dx,y:b.y+dy}));
  }
  for(const id of ['gw','gh'])$(id).max=Math.max(Number($(id).max),img.width*2,img.height*2);
  rebuildPositions();fit();
  if(updatePreview){clearTimeout(rotationPreviewTimer);rotationPreviewTimer=setTimeout(()=>previews(),120)}
}
const renderBeforeRotation=render;
render=function(withPreview=true){
  if(img&&img!==rotationCanvas&&img!==rotationOriginal){
    rotationOriginal=img;rotationAngle=0;rotationCanvas.width=img.width;rotationCanvas.height=img.height;
    rotationCanvas.hidden=false;$('source').hidden=true;rotationFields();paintRotation();
  }
  renderBeforeRotation(withPreview);
};
function requestRotation(value){if(!requireImage())return;const angle=normalizedAngle(value);cancelAnimationFrame(rotationFrame);rotationFrame=requestAnimationFrame(()=>setRotation(angle))}
$('rotationRange').onpointerdown=()=>{if(img)snapshot()};$('rotationRange').onkeydown=e=>{if(img&&e.key.startsWith('Arrow'))snapshot()};
$('rotationRange').oninput=()=>requestRotation($('rotationRange').value);
$('rotationNumber').onfocus=()=>{if(img)snapshot()};$('rotationNumber').oninput=()=>{if($('rotationNumber').value!==''&&Number.isFinite(Number($('rotationNumber').value)))requestRotation($('rotationNumber').value)};
$('rotationNumber').onchange=()=>requestRotation($('rotationNumber').value);
for(const [id,delta] of [['rotateMinus',-.1],['rotatePlus',.1]])$(id).onclick=()=>{if(!requireImage())return;cancelAnimationFrame(rotationFrame);snapshot();setRotation(rotationAngle+delta)};
$('rotationReset').onclick=()=>{if(!requireImage())return;cancelAnimationFrame(rotationFrame);snapshot();setRotation(0)};
const stateBeforeRotation=guideState;guideState=function(){return {...stateBeforeRotation(),rotationAngle}};
const undoBeforeRotation=$('undo').onclick;$('undo').onclick=()=>{if(!history.length)return;cancelAnimationFrame(rotationFrame);const state=JSON.parse(history[history.length-1]);undoBeforeRotation();setRotation(state.rotationAngle??0,false,false);previews()};
if(img)render();
