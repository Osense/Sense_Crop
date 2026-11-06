let correctionMode='',correctionLines=[],correctionStroke=null,correctionBusy=false,correctionSourceId=0,correctionSequence=0;
const correctionSources=new Map(),correctionPanel=document.createElement('div');
correctionPanel.className='correction-panel';correctionPanel.innerHTML=`<div class="correction-buttons"><button id="straightenOne" aria-pressed="false">선 1개로 수평 맞추기</button><button id="straightenFour" aria-pressed="false">선 4개로 원근 보정</button><button id="correctionApply" class="dark" disabled>자동 보정</button><button id="correctionClear" hidden>선 지우기</button><button id="correctionCancel" hidden>보정 취소</button><button id="correctionRestore" hidden>원본 복원</button></div><p id="correctionStatus" role="status">기준선을 드래그해 스캔 기울기나 원근을 보정할 수 있어요.</p><div id="correctionLineList"></div>`;
rotateBar.after(correctionPanel);
const correctionSVG=document.createElementNS('http://www.w3.org/2000/svg','svg');correctionSVG.id='correctionOverlay';correctionSVG.setAttribute('aria-hidden','true');$('stage').append(correctionSVG);
function correctionDrawingActive(){return Boolean(correctionMode)&&!correctionBusy}
function correctionMessage(){
  if(correctionBusy)return;
  const h=correctionLines.filter(l=>CorrectionMath.axis(l)==='h').length,v=correctionLines.length-h;
  $('straightenOne').setAttribute('aria-pressed',String(correctionMode==='one'));$('straightenFour').setAttribute('aria-pressed',String(correctionMode==='four'));
  $('correctionApply').disabled=correctionMode==='one'?correctionLines.length!==1:correctionMode==='four'?h!==2||v!==2:true;
  $('correctionClear').hidden=!correctionMode;$('correctionCancel').hidden=!correctionMode;$('correctionRestore').hidden=!correctionSourceId;
  $('viewport').classList.toggle('correction-drawing',Boolean(correctionMode));
  $('correctionStatus').textContent=!correctionMode?'기준선을 드래그해 스캔 기울기나 원근을 보정할 수 있어요.':correctionMode==='one'?(correctionLines.length?'기준선이 준비됐어요. 끝점을 옮겨 미세 조절한 뒤 ‘자동 보정’을 누르세요.':'수평 또는 수직이어야 할 테두리를 길게 드래그하세요. 방향은 자동으로 인식합니다.'):`가로 ${h}/2 · 세로 ${v}/2 — 학습지의 위·아래·왼쪽·오른쪽 테두리를 순서와 관계없이 그으세요. 네 선을 그린 뒤 끝점을 드래그로 조절할 수 있어요.`;
  $('correctionLineList').hidden=!correctionMode;$('correctionLineList').replaceChildren();correctionLines.forEach((line,i)=>{const btn=document.createElement('button');btn.textContent=(CorrectionMath.axis(line)==='h'?'가로':'세로')+' '+(i+1)+' ×';btn.title='이 기준선 삭제';btn.onclick=()=>{correctionLines.splice(i,1);correctionMessage();drawCorrectionOverlay()};$('correctionLineList').append(btn)});
}
function drawCorrectionOverlay(){
  correctionSVG.replaceChildren();if(!img)return;correctionSVG.setAttribute('viewBox',`0 0 ${img.width} ${img.height}`);
  const lines=correctionLines.map((line,i)=>({...line,index:i}));if(correctionStroke?.index==null&&correctionStroke)lines.push({...correctionStroke,index:lines.length});
  lines.forEach(line=>{
    const axis=CorrectionMath.axis(line),color=axis==='h'?'#d26925':'#8353b9',node=document.createElementNS(correctionSVG.namespaceURI,'line');
    for(const [key,value] of Object.entries({x1:line.a.x,y1:line.a.y,x2:line.b.x,y2:line.b.y,stroke:color,'stroke-width':3,'vector-effect':'non-scaling-stroke'}))node.setAttribute(key,value);correctionSVG.append(node);
    for(const p of [line.a,line.b]){const circle=document.createElementNS(correctionSVG.namespaceURI,'circle');for(const [key,value] of Object.entries({cx:p.x,cy:p.y,r:6/scale,fill:'white',stroke:color,'stroke-width':2,'vector-effect':'non-scaling-stroke'}))circle.setAttribute(key,value);correctionSVG.append(circle)}
    const text=document.createElementNS(correctionSVG.namespaceURI,'text');text.setAttribute('x',(line.a.x+line.b.x)/2+8/scale);text.setAttribute('y',(line.a.y+line.b.y)/2-10/scale);text.setAttribute('font-size',12/scale);text.setAttribute('fill',color);text.setAttribute('paint-order','stroke');text.setAttribute('stroke','white');text.setAttribute('stroke-width',3/scale);text.textContent=(axis==='h'?'가로 ':'세로 ')+(line.index+1);correctionSVG.append(text);
  });
}
function cancelCorrectionStroke(){if(!correctionStroke)return;if(correctionStroke.original)correctionLines[correctionStroke.index]=correctionStroke.original;correctionStroke=null;drawCorrectionOverlay()}
function stopCorrection(){cancelCorrectionStroke();correctionMode='';correctionLines=[];correctionMessage();drawCorrectionOverlay()}
function startCorrection(mode){if(!requireImage()||correctionBusy)return;cancelAnimationFrame(rotationFrame);if(correctionMode===mode)return stopCorrection();correctionMode=mode;correctionLines=[];correctionStroke=null;handMode=false;$('panMode').setAttribute('aria-pressed','false');$('viewport').classList.remove('hand-mode');correctionMessage();drawCorrectionOverlay()}
function correctionPoint(e){const r=$('stage').getBoundingClientRect();return {x:Math.max(0,Math.min(img.width,(e.clientX-r.left)/scale)),y:Math.max(0,Math.min(img.height,(e.clientY-r.top)/scale))}}
$('viewport').addEventListener('pointerdown',e=>{
  if(!correctionDrawingActive()||handMode||e.button!==0||!e.target.closest('#stage'))return;
  e.preventDefault();e.stopImmediatePropagation();const p=correctionPoint(e);let handle=null;
  if(correctionMode==='one'||correctionLines.length===4)for(let i=0;i<correctionLines.length;i++)for(const end of ['a','b'])if(CorrectionMath.distance(p,correctionLines[i][end])*scale<=12)handle={i,end};
  if(handle){const line=correctionLines[handle.i];correctionStroke={id:e.pointerId,index:handle.i,end:handle.end,original:{a:{...line.a},b:{...line.b}}}}
  else{if(correctionMode==='four'&&correctionLines.length===4)return toast('네 선이 준비됐어요. 끝점을 조절하거나 ‘자동 보정’을 눌러 주세요.');correctionStroke={id:e.pointerId,a:p,b:{...p}}}
  $('viewport').setPointerCapture(e.pointerId);e.preventDefault();e.stopImmediatePropagation();drawCorrectionOverlay();
},true);
$('viewport').addEventListener('pointermove',e=>{if(!correctionStroke||e.pointerId!==correctionStroke.id)return;const p=correctionPoint(e);if(correctionStroke.index!=null)correctionLines[correctionStroke.index][correctionStroke.end]=p;else correctionStroke.b=p;e.preventDefault();e.stopImmediatePropagation();drawCorrectionOverlay()},true);
function finishCorrectionStroke(e){
  if(!correctionStroke||e.pointerId!==correctionStroke.id)return;e.preventDefault();e.stopImmediatePropagation();
  if(e.type==='pointercancel'){cancelCorrectionStroke();return}
  if(correctionStroke.index!=null)correctionLines[correctionStroke.index][correctionStroke.end]=correctionPoint(e);else correctionStroke.b=correctionPoint(e);
  const stroke=correctionStroke,line=stroke.index!=null?correctionLines[stroke.index]:{a:stroke.a,b:stroke.b},other=correctionLines.filter((_,i)=>i!==stroke.index),axis=CorrectionMath.axis(line);
  if(CorrectionMath.distance(line.a,line.b)*scale<20){if(stroke.original)correctionLines[stroke.index]=stroke.original;toast('정확한 보정을 위해 기준선을 조금 더 길게 그어 주세요.')}
  else if(correctionMode==='four'&&other.filter(l=>CorrectionMath.axis(l)===axis).length>=2){if(stroke.original)correctionLines[stroke.index]=stroke.original;toast((axis==='h'?'가로':'세로')+'선은 2개만 필요합니다. 다른 방향의 테두리를 그어 주세요.')}
  else if(stroke.index==null){if(correctionMode==='one')correctionLines=[line];else correctionLines.push(line)}
  correctionStroke=null;correctionMessage();drawCorrectionOverlay();
}
$('viewport').addEventListener('pointerup',finishCorrectionStroke,true);$('viewport').addEventListener('pointercancel',finishCorrectionStroke,true);
$('straightenOne').onclick=()=>startCorrection('one');$('straightenFour').onclick=()=>startCorrection('four');
$('correctionClear').onclick=()=>{cancelCorrectionStroke();correctionLines=[];correctionMessage();drawCorrectionOverlay()};$('correctionCancel').onclick=stopCorrection;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&correctionMode&&!correctionBusy){e.preventDefault();stopCorrection()}},true);
function mappedFrame(b,m){const points=[{x:b.x,y:b.y},{x:b.x+b.w,y:b.y},{x:b.x+b.w,y:b.y+b.h},{x:b.x,y:b.y+b.h}].map(p=>CorrectionMath.point(m,p)),xs=points.map(p=>p.x),ys=points.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)}}
function correctionBusyState(value){correctionBusy=value;document.querySelector('main').inert=value;document.body.classList.toggle('correction-busy',value)}
async function applyCorrection(){
  if(correctionBusy||!requireImage())return;
  cancelAnimationFrame(rotationFrame);clearTimeout(rotationPreviewTimer);
  if(correctionMode==='one'){
    if(correctionLines.length!==1)return;
    const delta=CorrectionMath.correctionAngle(correctionLines[0]);snapshot();stopCorrection();setRotation(rotationAngle+delta);previews();toast('기준선에 맞춰 '+Math.abs(delta).toFixed(1)+'° 기울기를 보정했어요.');return;
  }
  if(correctionMode!=='four')return;
  let worker;
  try{
    const plan=CorrectionMath.plan(correctionLines,img.width,img.height),sw=img.width,sh=img.height;
    // Compute layouts before launching; a horizon outside the photo can still cross an outlying crop.
    const nextVertical=vertical.map(x=>CorrectionMath.point(plan.matrix,{x,y:sh/2}).x),nextHorizontal=horizontal.map(y=>CorrectionMath.point(plan.matrix,{x:sw/2,y}).y),nextFrames=freeFrames.map(b=>mappedFrame(b,plan.matrix)),nextBoxes=boxes.map(b=>mappedFrame(b,plan.matrix));
    const pixels=rotationCanvas.getContext('2d').getImageData(0,0,sw,sh);
    correctionBusyState(true);$('correctionStatus').textContent='원근 보정 중 · 0%';
    worker=new Worker('correction-worker.js');
    const result=await new Promise((resolve,reject)=>{worker.onmessage=({data})=>{if(data.error)reject(Error(data.error));else if(data.buffer)resolve(data);else $('correctionStatus').textContent='원근 보정 중 · '+data.progress+'%'};worker.onerror=()=>reject(Error('이미지 보정을 실행하지 못했어요. 다시 시도해 주세요.'));worker.postMessage({sw,sh,w:plan.w,h:plan.h,matrix:plan.inverse,buffer:pixels.data.buffer},[pixels.data.buffer])});
    const corrected=document.createElement('canvas');corrected.width=result.w;corrected.height=result.h;corrected.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(result.buffer),result.w,result.h),0,0);
    snapshot();correctionSourceId=++correctionSequence;correctionSources.set(correctionSourceId,corrected);rotationOriginal=corrected;
    vertical=nextVertical;horizontal=nextHorizontal;freeFrames=nextFrames;
    if(cropMode==='guide'){const frame=nextBoxes[Math.max(0,selected)];if(frame)showDimensions(Math.max(10,frame.w),Math.max(10,frame.h));syncGuideBoxes()}else boxes=nextBoxes;
    correctionBusyState(false);stopCorrection();setRotation(0,false,false);previews();toast('가로·세로 테두리를 직사각형으로 보정했어요. 이미지 전체가 들어오도록 캔버스도 확장했어요.');
  }catch(e){correctionBusyState(false);correctionMessage();toast(e.message||'보정하지 못했어요. 기준선을 다시 그어 주세요.')}
  finally{worker?.terminate()}
}
$('correctionApply').onclick=applyCorrection;
$('correctionRestore').onclick=()=>{if(correctionBusy||!correctionSources.has(0))return;snapshot();stopCorrection();correctionSourceId=0;rotationOriginal=correctionSources.get(0);setRotation(0);correctionMessage();previews();toast('처음 불러온 원본으로 복원했어요.')};
const stateBeforeCorrection=guideState;guideState=function(){return {...stateBeforeCorrection(),correctionSourceId}};
const undoBeforeCorrection=$('undo').onclick;$('undo').onclick=()=>{if(correctionBusy||!history.length)return;const state=JSON.parse(history[history.length-1]),sourceId=state.correctionSourceId??0;if(correctionSources.has(sourceId)){correctionSourceId=sourceId;rotationOriginal=correctionSources.get(sourceId)}stopCorrection();undoBeforeCorrection();correctionMessage();drawCorrectionOverlay()};
const renderBeforeCorrection=render;render=function(withPreview=true){
  if(img&&img!==rotationCanvas&&img!==rotationOriginal){correctionSources.clear();correctionSources.set(0,img);correctionSourceId=0;correctionSequence=0;correctionMode='';correctionLines=[];correctionStroke=null;correctionMessage()}
  renderBeforeCorrection(withPreview);drawCorrectionOverlay();
};
const rotationBeforeCorrection=setRotation;setRotation=function(...args){stopCorrection();return rotationBeforeCorrection(...args)};
if(img&&!correctionSources.size)correctionSources.set(0,rotationOriginal);correctionMessage();drawCorrectionOverlay();
