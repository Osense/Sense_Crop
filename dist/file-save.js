// Keep mobile file handoff in a fresh user gesture after async image/ZIP work.
(() => {
  const mobileSave = () => navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|WORKS|; wv\)/i.test(navigator.userAgent);
  let urls = [], preparing = false;
  const dialog = document.createElement('dialog');
  dialog.id = 'fileSaveDialog';dialog.setAttribute('aria-labelledby','fileSaveTitle');
  dialog.innerHTML = '<div class="file-save-heading"><h2 id="fileSaveTitle">파일 준비 완료</h2><button id="fileSaveClose" type="button">닫기</button></div><p id="fileSaveStatus" role="status">아래 버튼을 눌러 기기에 저장하세요.</p><button id="fileSaveShare" class="primary" type="button">공유해서 저장</button><div id="fileSaveList"></div><details class="file-save-help"><summary>저장이 안 되나요?</summary><p>네이버웍스 등 앱 안의 브라우저에서는 파일 저장이 제한될 수 있어요. ‘공유해서 저장’을 먼저 시도하세요. 공유 기능도 없다면 앱 메뉴에서 Chrome 또는 Safari로 이 페이지를 열고 이미지를 다시 불러와 주세요. 현재 편집 내용은 다른 브라우저로 자동 이동하지 않습니다.</p><button id="fileSaveCopy" type="button">사이트 주소 복사</button><input id="fileSaveAddress" aria-label="외부 브라우저에서 열 사이트 주소" readonly></details>';
  document.body.append(dialog);
  const siteAddress = new URL(location.pathname,location.origin).href;
  $('fileSaveAddress').value=siteAddress;
  if(/WORKS|NAVER|; wv\)/i.test(navigator.userAgent)){
    const notice=document.createElement('p');notice.className='file-save-browser-hint file-save-entry-hint';
    notice.dataset.mobileSteps='1';
    notice.textContent='앱 안의 브라우저에서는 저장이 제한될 수 있어요. 작업을 시작하기 전에 앱 메뉴의 ‘외부 브라우저로 열기’로 Chrome·Safari를 이용하는 것을 권장합니다.';
    document.querySelector('.mobile-step-heading').after(notice);
  }
  function releaseUrls(){const old=urls;urls=[];setTimeout(()=>old.forEach(url=>URL.revokeObjectURL(url)),60000)}
  $('fileSaveClose').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{releaseUrls();$('fileSaveList').replaceChildren();$('fileSaveShare').onclick=null});
  $('fileSaveCopy').onclick=async()=>{
    try{await navigator.clipboard.writeText(siteAddress);$('fileSaveStatus').textContent='사이트 주소를 복사했어요. Chrome 또는 Safari의 주소창에 붙여 넣으세요.'}
    catch{$('fileSaveAddress').focus();$('fileSaveAddress').select();$('fileSaveStatus').textContent='아래 사이트 주소를 길게 눌러 복사해 주세요.'}
  };
  function presentFiles(files){
    releaseUrls();$('fileSaveList').replaceChildren();
    $('fileSaveStatus').textContent='파일이 준비됐어요. 다운로드 또는 공유해서 저장을 눌러 주세요.';
    const nativeFiles=files.map(f=>new File([f.blob],f.name,{type:f.blob.type||'application/octet-stream'}));
    let canShare=false;
    try{canShare=typeof navigator.share==='function'&&typeof navigator.canShare==='function'&&navigator.canShare({files:nativeFiles})}catch{}
    $('fileSaveShare').hidden=!canShare;
    $('fileSaveShare').disabled=false;
    $('fileSaveShare').onclick=async()=>{
      // Call share immediately from the click; do not regenerate files here.
      $('fileSaveShare').disabled=true;
      try{
        await navigator.share({files:nativeFiles});
        $('fileSaveStatus').textContent='공유 처리가 끝났어요. 선택한 앱이나 파일 앱에서 결과를 확인하세요.';
      }catch(error){
        $('fileSaveStatus').textContent=error.name==='AbortError'?'공유를 취소했어요. 아래에서 다시 저장할 수 있어요.':'이 브라우저에서 공유하지 못했어요. 다운로드를 누르거나 아래 저장 도움말을 확인하세요.';
      }finally{$('fileSaveShare').disabled=false}
    };
    for(const file of files){
      const url=URL.createObjectURL(file.blob);urls.push(url);
      const row=document.createElement('div');row.className='file-save-row';
      const label=document.createElement('span');label.textContent=file.name;
      const link=document.createElement('a');link.href=url;link.download=file.name;link.textContent='다운로드';
      link.onclick=()=>{$('fileSaveStatus').textContent='다운로드를 요청했어요. 기기의 다운로드 목록에서 확인하세요. 실패하면 공유해서 저장 또는 아래 도움말을 이용하세요.'};
      row.append(label,link);$('fileSaveList').append(row);
    }
    if(!dialog.open)dialog.showModal();
  }
  function directSave(blob,name){
    const link=document.createElement('a'),url=URL.createObjectURL(blob);
    link.href=url;link.download=name;link.style.display='none';document.body.append(link);
    link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  save=function(blob,name){if(mobileSave())presentFiles([{blob,name}]);else directSave(blob,name)};
  download=async function(isZip){
    if(preparing)return;
    if(!boxes.length)return toast('저장할 영역을 먼저 만들어 주세요.');
    preparing=true;$('zip').disabled=$('individual').disabled=true;
    try{
      const files=await exportBlobs();
      const result=isZip?[{blob:await zip(files),name:filename(0).replace(/_\d+\.[^.]+$/,'.zip')}]:files;
      if(mobileSave()){
        presentFiles(result);toast('파일이 준비됐어요. 저장 방법을 선택해 주세요.');
      }else{
        for(const file of result){directSave(file.blob,file.name);if(!isZip)await new Promise(r=>setTimeout(r,200))}
        toast('다운로드를 요청했어요. 브라우저의 다운로드 목록을 확인하세요.');
      }
    }catch(error){console.error(error);toast('파일을 준비하지 못했어요. 출력 크기나 영역 수를 줄여 다시 시도해 주세요.')}
    finally{preparing=false;$('zip').disabled=$('individual').disabled=false}
  };
  const hint=document.createElement('p');hint.className='file-save-browser-hint';
  hint.textContent='앱 안에서 저장이 안 되면 ‘공유해서 저장’을 이용하세요. 공유도 지원하지 않으면 Chrome·Safari에서 열어 사용해 주세요.';
  document.querySelector('.exportbar').after(hint);hint.dataset.mobileSteps='4';
})();
