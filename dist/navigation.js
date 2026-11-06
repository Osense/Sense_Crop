const viewport=$('viewport'),stage=$('stage');
const rotateBar=document.createElement('div');rotateBar.className='canvas-rotation';rotateBar.innerHTML='<label for="rotationNumber">기울기 보정 <small>°</small></label>';
for(const id of ['rotateMinus','rotationNumber','rotatePlus','rotationRange','rotationReset'])rotateBar.append($(id));
rotateBar.title='시계 방향 + / 반시계 방향 − · 회전한 이미지에 맞춰 캔버스를 확장합니다';
document.querySelector('.toolbar').after(rotateBar);rotationControls.remove();
const nav=document.createElement('div');nav.className='canvas-navigation';nav.innerHTML='<button id="panMode" aria-pressed="false">✥ 화면 이동</button><button id="zoomOut" aria-label="축소">−</button><output id="zoomValue">화면에 맞춤</output><button id="zoomIn" aria-label="확대">＋</button><button id="zoomFit">화면에 맞춤</button><span>두 손가락: 확대·이동 · 휠: 확대 · 휠 버튼 드래그: 이동</span>';rotateBar.after(nav);
let handMode=false,navGesture=null,navPointers=new Map(),firstTouchState=null;
const customZoom=document.createElement('option');customZoom.value='custom';customZoom.textContent='사용자 배율';$('zoom').append(customZoom);
function zoomLabel(){const s=Math.round(scale*100)+'%';$('zoomValue').textContent=s;customZoom.textContent=s}
function zoomAt(next,clientX,clientY){if(!img)return;next=Math.max(.02,Math.min(8,next));const rect=stage.getBoundingClientRect(),worldX=(clientX-rect.left)/scale,worldY=(clientY-rect.top)/scale;scale=next;stage.style.width=img.width*scale+'px';stage.style.height=img.height*scale+'px';$('zoom').value='custom';render(false);const after=stage.getBoundingClientRect();viewport.scrollLeft+=after.left+worldX*scale-clientX;viewport.scrollTop+=after.top+worldY*scale-clientY;zoomLabel()}
function zoomCenter(factor){const r=viewport.getBoundingClientRect();zoomAt(scale*factor,r.left+viewport.clientWidth/2,r.top+viewport.clientHeight/2)}
const baseFit=fit;window.removeEventListener('resize',baseFit);fit=function(){if($('zoom').value==='custom'&&img){stage.style.width=img.width*scale+'px';stage.style.height=img.height*scale+'px';render(false)}else baseFit();zoomLabel()};$('zoom').onchange=fit;
$('zoomIn').onclick=()=>zoomCenter(1.25);$('zoomOut').onclick=()=>zoomCenter(.8);$('zoomFit').onclick=()=>{$('zoom').value='fit';fit()};
$('panMode').onclick=()=>{handMode=!handMode;$('panMode').setAttribute('aria-pressed',String(handMode));viewport.classList.toggle('hand-mode',handMode)};
viewport.addEventListener('wheel',e=>{if(!img)return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewport.clientHeight:1);zoomAt(scale*Math.exp(-Math.max(-250,Math.min(250,delta))*.002),e.clientX,e.clientY)},{passive:false});
function swallow(e){e.preventDefault();e.stopImmediatePropagation()}
function pairInfo(){const p=Array.from(navPointers.values()).slice(0,2);return {x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2,d:Math.max(1,Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y))}}
function beginPinch(){if(typeof cancelCorrectionStroke==='function')cancelCorrectionStroke();if(drag||guideDrag){if(firstTouchState){boxes=firstTouchState.boxes;vertical=firstTouchState.vertical;horizontal=firstTouchState.horizontal;history.length=firstTouchState.historyLength}drag=null;guideDrag=null;rebuildPositions();render(false)}const p=pairInfo(),rect=stage.getBoundingClientRect();navGesture={kind:'pinch',distance:p.d,scale,worldX:(p.x-rect.left)/scale,worldY:(p.y-rect.top)/scale};viewport.classList.add('panning')}
viewport.addEventListener('pointerdown',e=>{if(!img)return;
  if(e.pointerType==='touch'){
    if(!navPointers.size)firstTouchState={boxes:boxes.map(b=>({...b})),vertical:[...vertical],horizontal:[...horizontal],historyLength:history.length};
    navPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(navPointers.size>=2){viewport.setPointerCapture(e.pointerId);beginPinch();swallow(e);return}
  }
  if(typeof correctionDrawingActive==='function'&&correctionDrawingActive()&&!handMode&&e.button!==1)return;
  if(e.button===1||handMode||(e.pointerType==='touch'&&!e.target.closest('.box,.guide-line,.frame-resize-handle'))){
    navGesture={kind:'pan',id:e.pointerId,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('panning');swallow(e);
  }
},true);
viewport.addEventListener('pointermove',e=>{if(navPointers.has(e.pointerId))navPointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(!navGesture)return;
  if(navGesture.kind==='pinch'&&navPointers.size>=2){const p=pairInfo(),g=navGesture;zoomAt(g.scale*p.d/g.distance,p.x,p.y);const rect=stage.getBoundingClientRect();viewport.scrollLeft+=rect.left+g.worldX*scale-p.x;viewport.scrollTop+=rect.top+g.worldY*scale-p.y}
  else if(navGesture.kind==='pan'&&navGesture.id===e.pointerId){viewport.scrollLeft=navGesture.left-(e.clientX-navGesture.x);viewport.scrollTop=navGesture.top-(e.clientY-navGesture.y)}
  swallow(e);
},true);
function endNavigation(e){navPointers.delete(e.pointerId);if(!navGesture){if(!navPointers.size)firstTouchState=null;return}swallow(e);
  if(navGesture.kind==='pan'&&navGesture.id!==e.pointerId)return;
  if(navPointers.size>=2){beginPinch();return}
  if(navPointers.size){navGesture={kind:'wait'};return}
  navGesture=null;firstTouchState=null;viewport.classList.remove('panning');previews();
}
viewport.addEventListener('pointerup',endNavigation,true);viewport.addEventListener('pointercancel',endNavigation,true);
viewport.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault()});
viewport.addEventListener('dragstart',e=>e.preventDefault());
window.addEventListener('resize',()=>{if($('zoom').value==='fit')fit()});zoomLabel();
