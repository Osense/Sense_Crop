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
    const vs = vertical.slice().sort((a,b)=>a-b), hs = horizontal.slice().sort((a,b)=>a-b);
    const cx = vs[index % vs.length], cy = hs[Math.floor(index / vs.length)];
    const center = document.createElement('span');
    center.className = 'frame-center';center.style.left = cx*scale+'px';center.style.top = cy*scale+'px';
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
  function cancelResize() {
    if (!resizing) return;
    const state=resizing;resizing=null;
    guideAutoSize=state.auto;$('guideAutoSize').checked=state.auto;
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
    resizing=null;e.preventDefault();e.stopImmediatePropagation();previews();
  },true);
  $('viewport').addEventListener('pointercancel',e=>{if(resizing&&e.pointerId===resizing.id)cancelResize()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')cancelResize()},true);
  const previousRender=render;
  render=function(...args){previousRender(...args);drawHandles()};
  // Keep numeric dimensions available; direct manipulation replaces sliders.
  $('gw').hidden=$('gh').hidden=true;
  const hint=document.createElement('p');hint.className='hint frame-resize-hint';
  hint.textContent='영역을 선택한 뒤 흰색 테두리 손잡이를 드래그하세요. 교점을 중심으로 모든 영역의 크기가 함께 바뀝니다. 비율을 자유롭게 바꾸려면 자유 비율을 선택하세요.';
  hint.dataset.mobileSteps='3';$('ratio').closest('.section').append(hint);
  const oldHint=$('guideControls').lastElementChild;
  if(oldHint?.classList.contains('hint'))oldHint.textContent='자동 맞춤은 이미지를 빈틈없이 나눕니다. 테두리를 드래그하면 교점을 중심으로 한 수동 크기로 전환돼요.';
  $('mobileStepHint').textContent=document.body.dataset.mobileStep==='3'?hint.textContent:$('mobileStepHint').textContent;
  render(false);
})();
