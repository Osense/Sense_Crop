// Keep pixel inputs beside their sliders in both crop modes.
for(const [numberId,rangeId,outputId] of [['cw','gw','gwValue'],['ch','gh','ghValue']]){
  const number=$(numberId),range=$(rangeId),output=$(outputId);
  const oldLabel=range.closest('label'),label=number.closest('label');
  label.append(range,output);oldLabel.remove();
  range.setAttribute('aria-label',numberId==='cw'?'영역 너비 슬라이더':'영역 높이 슬라이더');
  number.step=range.step='1';number.min='10';
}
function showDimensions(w,h){
  for(const [numberId,rangeId,outputId,value] of [['cw','gw','gwValue',w],['ch','gh','ghValue',h]]){
    const n=Math.round(value);if(n>Number($(rangeId).max))$(rangeId).max=n;
    $(numberId).value=$(rangeId).value=n;$(outputId).textContent=n+' px';
  }
}
syncDimensions=function(axis){
  let w=Number($('gw').value),h=Number($('gh').value),r=Number($('ratio').value);
  if(r){if(axis==='h')w=Math.round(h*r);else h=Math.round(w/r)}
  if(cropMode==='guide'){
    guideAutoSize=false;$('guideAutoSize').checked=false;
    showDimensions(w,h);syncGuideBoxes();render(false);
  }else{
    if(img){const f=Math.min(1,img.width/w,img.height/h);w*=f;h*=f}
    showDimensions(w,h);
    if(boxes[selected]){const b=boxes[selected];boxes[selected]=bounds({...b,x:b.x+(b.w-w)/2,y:b.y+(b.h-h)/2,w,h});render(false)}
  }
};
for(const [id,axis] of [['cw','w'],['ch','h']]){
  const number=$(id),range=$(axis==='w'?'gw':'gh');
  number.onfocus=()=>snapshot();
  number.oninput=()=>{
    if(number.value===''||!Number.isFinite(Number(number.value))||Number(number.value)<10)return;
    const value=Math.min(100000,Math.round(Number(number.value)));
    if(value>Number(range.max))range.max=value;
    range.value=value;syncDimensions(axis);
  };
  number.onchange=()=>{if(number.value===''||Number(number.value)<10){number.value=10;number.oninput()}previews()};
}
$('ratio').onchange=()=>{snapshot();syncDimensions('w');previews()};
const renderWithDimensions=render;
render=function(withPreview=true){
  if((cropMode==='free'||guideAutoSize)&&boxes[selected])showDimensions(boxes[selected].w,boxes[selected].h);
  else if(cropMode==='guide')showDimensions(Number($('gw').value),Number($('gh').value));
  renderWithDimensions(withPreview);
};
render(false);
