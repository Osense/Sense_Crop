// Resize guide frames symmetrically around their guide intersections.
(() => {
  let resizing = null;
  const layer = document.createElement('div');
  layer.id = 'frameResizeLayer';
  $('stage').append(layer);
  const names = {n:'위',s:'아래',w:'왼쪽',e:'오른쪽',nw:'왼쪽 위',ne:'오른쪽 위',sw:'왼쪽 아래',se:'오른쪽 아래'};
  function drawHandles() {
    layer.replaceChildren();
    if (!img || cropMode !== 'guide' || !boxes.length) return;
    const index = selected >= 0 ? selected : 0, b = boxes[index];
    const vs = vertical.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value), hs = horizontal.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value);
    const v=vs[index % vs.length],h=hs[Math.floor(index / vs.length)];
    const cx = v.value, cy = h.value;
    const center = document.createElement('button');
    center.type='button';center.setAttribute('aria-label','영역 중심 이동 · 가로선과 세로선 함께 이동');
    center.className = 'frame-center';center.style.left = cx*scale+'px';center.style.top = cy*scale+'px';
    center.onpointerdown=e=>{
      if(e.button!==0||handMode||correctionDrawingActive()||correctionBusy)return;
      e.preventDefault();e.stopPropagation();
      resizing={id:e.pointerId,direction:'center',vi:v.index,hi:h.index,cx,cy,scale,startX:e.clientX,startY:e.clientY,auto:guideAutoSize,gw:$('gw').value,gh:$('gh').value,historyLength:history.length,vertical:[...vertical],horizontal:[...horizontal],selected};
      snapshot();selected=index;activeGuide=null;
      guideAutoSize=false;$('guideAutoSize').checked=false;showDimensions(b.w,b.h);syncGuideBoxes();render(false);
      $('viewport').setPointerCapture(e.pointerId);
    };
    center.onkeydown=e=>{
      const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
      if(!delta||correctionBusy)return;
      e.preventDefault();e.stopPropagation();snapshot();
      guideAutoSize=false;$('guideAutoSize').checked=false;showDimensions(b.w,b.h);
      moveCenter({vi:v.index,hi:h.index,cx,cy},delta[0]*(e.shiftKey?10:1),delta[1]*(e.shiftKey?10:1));
      rebuildPositions();render();
    };
    layer.append(center);
    for (const [direction, name] of Object.entries(names)) {
      const handle = document.createElement('button');
      handle.type = 'button';handle.className = 'frame-resize-handle '+direction;
      handle.setAttribute('aria-label', name+' 테두리 크기 조절');
      handle.style.left = (direction.includes('w') ? b.x : direction.includes('e') ? b.x+b.w : b.x+b.w/2)*scale+'px';
      handle.style.top = (direction.includes('n') ? b.y : direction.includes('s') ? b.y+b.h : b.y+b.h/2)*scale+'px';
      handle.onpointerdown = e => {
        if (e.button !== 0 || handMode || correctionDrawingActive() || correctionBusy) return;
        e.preventDefault();e.stopPropagation();
        selected=index;activeGuide=null;
        resizing={id:e.pointerId,direction,cx,cy,scale,startX:e.clientX,startY:e.clientY,w:b.w,h:b.h,auto:guideAutoSize,gw:$('gw').value,gh:$('gh').value,ratio:$('ratio').value,historyLength:history.length};
        snapshot();
        // Auto-filled cells can be asymmetric: first manual resize centers them.
        guideAutoSize=false;$('guideAutoSize').checked=false;
        showDimensions(b.w,b.h);syncGuideBoxes();render(false);
        $('viewport').setPointerCapture(e.pointerId);
      };
      handle.onkeydown = e => {
        if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) return;
        e.preventDefault();e.stopPropagation();snapshot();selected=index;
        showDimensions(b.w,b.h);
        const axis = ['ArrowLeft','ArrowRight'].includes(e.key) ? 'w' : 'h';
        const delta = (['ArrowRight','ArrowDown'].includes(e.key)?1:-1)*(e.shiftKey?10:1)*2;
        $(axis==='w'?'gw':'gh').value=Math.max(10,(axis==='w'?b.w:b.h)+delta);
        syncDimensions(axis);previews();
      };
      layer.append(handle);
    }
  }
  function moveCenter(state,dx,dy){
    vertical[state.vi]=Math.max(0,Math.min(img.width,state.cx+dx));
    horizontal[state.hi]=Math.max(0,Math.min(img.height,state.cy+dy));
    const sortedIndices=arr=>arr.map((value,index)=>({value,index})).sort((a,b)=>a.value-b.value).map(p=>p.index);
    selected=sortedIndices(horizontal).indexOf(state.hi)*vertical.length+sortedIndices(vertical).indexOf(state.vi);
    syncGuideBoxes();
  }
  function cancelResize() {
    if (!resizing) return;
    const state=resizing;resizing=null;
    guideAutoSize=state.auto;$('guideAutoSize').checked=state.auto;
    if(state.direction==='center'){vertical=state.vertical;horizontal=state.horizontal;selected=state.selected;rebuildPositions()}
    showDimensions(Number(state.gw),Number(state.gh));
    history.length=state.historyLength;syncGuideBoxes();render();
  }
  document.addEventListener('pointerdown', e => {
    if (resizing && e.pointerId!==resizing.id) cancelResize();
  },true);
  $('viewport').addEventListener('pointermove', e => {
    if (!resizing || e.pointerId!==resizing.id) return;
    e.preventDefault();e.stopImmediatePropagation();
    const s=resizing, dx=(e.clientX-s.startX)/s.scale,dy=(e.clientY-s.startY)/s.scale;
    if(s.direction==='center'){moveCenter(s,dx,dy);render(false);return}
    let w=s.w,h=s.h;
    if(s.direction.includes('e'))w+=dx*2;
    if(s.direction.includes('w'))w-=dx*2;
    if(s.direction.includes('s'))h+=dy*2;
    if(s.direction.includes('n'))h-=dy*2;
    w=Math.max(10,Math.min(100000,w));h=Math.max(10,Math.min(100000,h));
    const ratio=Number(s.ratio);
    if(ratio){if(s.direction==='n'||s.direction==='s'){h=Math.max(h,10/ratio);w=h*ratio}else{w=Math.max(w,10*ratio);h=w/ratio}}
    showDimensions(w,h);syncGuideBoxes();render(false);
  },true);
  $('viewport').addEventListener('pointerup', e => {
    if(!resizing||e.pointerId!==resizing.id)return;
    const movedCenter=resizing.direction==='center';resizing=null;e.preventDefault();e.stopImmediatePropagation();if(movedCenter)rebuildPositions();previews();
  },true);
  $('viewport').addEventListener('pointercancel',e=>{if(resizing&&e.pointerId===resizing.id)cancelResize()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cancelResize()},true);
  const previousRender=render;
  render=function(...args){previousRender(...args);drawHandles()};
  // Keep numeric dimensions available; direct manipulation replaces sliders.
  $('gw').hidden=$('gh').hidden=true;
  const hint=document.createElement('p');hint.className='hint frame-resize-hint';
  hint.textContent='가운데 점을 드래그하면 연결된 가로·세로선이 함께 움직입니다. 흰색 테두리 손잡이로 크기를 조절하세요. 중심을 옮기거나 크기를 바꾸면 수동 크기로 전환됩니다.';
  hint.dataset.mobileSteps='3';$('ratio').closest('.section').append(hint);
  const oldHint=$('guideControls').lastElementChild;
  if(oldHint?.classList.contains('hint'))oldHint.textContent='자동 맞춤은 이미지를 빈틈없이 나눕니다. 테두리를 드래그하면 교점을 중심으로 한 수동 크기로 전환돼요.';
  $('mobileStepHint').textContent=document.body.dataset.mobileStep==='3'?hint.textContent:$('mobileStepHint').textContent;
  render(false);
})();
