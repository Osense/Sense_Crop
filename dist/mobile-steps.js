// Keep the existing controls and their handlers; steps only change visibility.
(() => {
  const mobile = window.matchMedia('(max-width: 720px)');
  let current = 1;
  const mark = (node, steps) => { if (node) node.dataset.mobileSteps = steps; };
  const cropSection = $('ratio').closest('.section');
  const sections = document.querySelectorAll('aside > .section');
  mark(sections[0], '1');
  mark(sections[2], '4');
  mark(cropSection, '2 3');
  mark(cropSection.querySelector('h2'), '3');
  mark($('cropMode').parentElement, '2 3');
  for (const child of cropSection.children) {
    if (child.contains($('cropMode')) || child.tagName === 'H2') continue;
    mark(child, child.contains($('cols')) || ['grid', 'gridReset'].includes(child.id) ? '2' : '3');
  }
  for (const child of $('guideControls').children) {
    mark(child, child.contains($('addVertical')) || child.id === 'guidePositions' || child === $('guideControls').firstElementChild ? '2' : '3');
  }
  mark(document.querySelector('.canvas-rotation'), '1');
  mark(document.querySelector('.correction-panel'), '1');
  mark(document.querySelector('.editor'), '1 2 3');
  for (const selector of ['.previewhead', '#previews', '.exportbar']) mark(document.querySelector(selector), '4');

  const titles = ['이미지 · 수평 보정', '가로·세로선 정렬', '캡처 영역 설정', '출력 · 저장'];
  const hints = ['이미지를 불러오고 기울기를 맞춰 주세요.', '가로·세로선을 그림의 중심에 맞춰 주세요.', '가이드선으로 중심을 옮기고, 테두리 손잡이로 영역 크기를 조절하세요.', '배율과 파일 형식을 정한 뒤 결과를 저장하세요.'];
  const heading = document.createElement('div');
  heading.className = 'mobile-step-heading';
  heading.innerHTML = '<div><small id="mobileStepCount"></small><h1 id="mobileStepTitle" tabindex="-1"></h1><p id="mobileStepHint"></p></div>';
  const previousButton=document.createElement('button');
  previousButton.id='mobilePrevious';previousButton.className='mobile-header-action';previousButton.textContent='‹ 이전';
  const nextButton=document.createElement('button');
  nextButton.id='mobileNext';nextButton.className='mobile-header-action dark';nextButton.textContent='다음 ›';
  const header=document.querySelector('header');
  header.prepend(previousButton);header.append(nextButton);
  document.querySelector('.layout').before(heading);
  const tabs = document.createElement('nav');
  tabs.className = 'mobile-step-tabs';
  tabs.setAttribute('aria-label', '이미지 편집 단계');
  ['불러오기·보정', '선 정렬', '캡처 영역', '출력·저장'].forEach((title, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerHTML = `<span>${i + 1}</span>${title}`;
    button.setAttribute('aria-label', `${i + 1}단계 ${titles[i]}`);
    button.onclick = () => selectStep(i + 1, true);
    tabs.append(button);
  });
  document.querySelector('main').append(tabs);

  // Place frequently used guide controls before the canvas on phones.
  const guideTools = document.createElement('div');
  guideTools.className = 'mobile-guide-tools';
  mark(guideTools, '2');
  const gridRow = document.createElement('div');gridRow.className = 'mobile-grid-row';
  const lineRow = document.createElement('div');lineRow.className = 'mobile-line-row';
  guideTools.append(gridRow,lineRow);
  document.querySelector('.layout').prepend(guideTools);
  const details = document.createElement('details');details.className = 'mobile-guide-details';
  mark(details, '2');
  const summary = document.createElement('summary');summary.textContent = '선 위치 미세 조절 · 추가 설정';
  details.append(summary);cropSection.append(details);
  const moves = [
    [$('cols').closest('.pair'),gridRow],[$('grid'),gridRow],
    [$('addVertical').closest('.pair'),lineRow],
    [$('guidePositions'),details],[$('cropMode').parentElement,details],[$('gridReset'),details]
  ].map(([node,target])=>{
    const anchor=document.createComment('desktop control position');node.before(anchor);
    return {node,target,anchor};
  });
  function arrangeControls() {
    for(const {node,target,anchor} of moves){
      if(mobile.matches)target.append(node);else anchor.after(node);
    }
  }
  arrangeControls();
  mobile.addEventListener('change',arrangeControls);
  function selectStep(step, focus = false) {
    if (typeof correctionBusy !== 'undefined' && correctionBusy) return;
    if (mobile.matches && step > 1 && !img) return toast('먼저 이미지를 불러와 주세요.');
    // Suspend drawing tools while retaining correction lines and all crop data.
    if (step !== current && mobile.matches) {
      cancelCorrectionStroke();
      guideDrag = null;
      drag = null;
    }
    current = step;
    document.body.dataset.mobileStep = String(step);
    $('mobileStepCount').textContent = `${step}/4`;
    $('mobileStepTitle').textContent = titles[step - 1];
    $('mobileStepHint').textContent = hints[step - 1];
    $('mobilePrevious').disabled = step === 1;
    $('mobileNext').disabled = step === 4 || !img;
    [...tabs.children].forEach((button, i) => {
      if (i + 1 === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    if (mobile.matches && focus) {
      window.scrollTo({top:0,behavior:'instant'});
      $('mobileStepTitle').focus({preventScroll: true});
    }
    requestAnimationFrame(() => { if (img) fit(); });
  }
  // Ignore correction gestures outside the correction step, without clearing work.
  const drawing = correctionDrawingActive;
  correctionDrawingActive = () => drawing() && (!mobile.matches || current === 1);
  $('mobilePrevious').onclick = () => selectStep(Math.max(1, current - 1), true);
  $('mobileNext').onclick = () => selectStep(Math.min(4, current + 1), true);
  mobile.addEventListener('change', () => selectStep(current));
  let hadImage=false;
  function updateImageEntry(){
    const hasImage=Boolean(img);
    document.body.classList.toggle('has-image',hasImage);
    $('mobileNext').disabled=current===4||!hasImage;
    if(hasImage!==hadImage){
      hadImage=hasImage;
      if(hasImage&&mobile.matches)requestAnimationFrame(()=>fit());
    }
  }
  const renderBeforeEntry=render;
  render=function(...args){updateImageEntry();return renderBeforeEntry(...args)};
  updateImageEntry();
  selectStep(1);
})();
