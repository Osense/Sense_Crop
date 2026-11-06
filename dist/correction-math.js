// Geometry shared with deterministic tests. Coordinates are image pixels.
const CorrectionMath=(()=>{
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  function axis(line){return Math.abs(line.b.x-line.a.x)>=Math.abs(line.b.y-line.a.y)?'h':'v'}
  function correctionAngle(line){const a=Math.atan2(line.b.y-line.a.y,line.b.x-line.a.x)*180/Math.PI;return -(a-Math.round(a/90)*90)}
  function intersect(l,m){const x=l.b.x-l.a.x,y=l.b.y-l.a.y,u=m.b.x-m.a.x,v=m.b.y-m.a.y,d=x*v-y*u;if(Math.abs(d)<1e-8)throw Error('기준선이 평행하거나 너무 가깝습니다. 서로 다른 테두리에 선을 그어 주세요.');const t=((m.a.x-l.a.x)*v-(m.a.y-l.a.y)*u)/d;return {x:l.a.x+t*x,y:l.a.y+t*y}}
  function solve(a,b){const n=b.length;a=a.map((row,i)=>[...row,b[i]]);for(let c=0;c<n;c++){let pivot=c;for(let r=c+1;r<n;r++)if(Math.abs(a[r][c])>Math.abs(a[pivot][c]))pivot=r;if(Math.abs(a[pivot][c])<1e-10)throw Error('기준선으로 보정할 수 없습니다. 네 테두리를 더 길게 그어 주세요.');[a[c],a[pivot]]=[a[pivot],a[c]];const v=a[c][c];for(let k=c;k<=n;k++)a[c][k]/=v;for(let r=0;r<n;r++){if(r===c)continue;const f=a[r][c];for(let k=c;k<=n;k++)a[r][k]-=f*a[c][k]}}return a.map(row=>row[n])}
  function homography(from,to){const a=[],b=[];from.forEach((p,i)=>{const q=to[i];a.push([p.x,p.y,1,0,0,0,-q.x*p.x,-q.x*p.y]);b.push(q.x);a.push([0,0,0,p.x,p.y,1,-q.y*p.x,-q.y*p.y]);b.push(q.y)});return [...solve(a,b),1]}
  function point(m,p){const d=m[6]*p.x+m[7]*p.y+m[8];if(Math.abs(d)<1e-8)throw Error('이미지 가장자리의 왜곡이 너무 큽니다. 기준선을 다시 그어 주세요.');return {x:(m[0]*p.x+m[1]*p.y+m[2])/d,y:(m[3]*p.x+m[4]*p.y+m[5])/d}}
  function inverse(m){const [a,b,c,d,e,f,g,h,i]=m,A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,D=c*h-b*i,E=a*i-c*g,F=b*g-a*h,G=b*f-c*e,H=c*d-a*f,I=a*e-b*d,det=a*A+b*B+c*C;if(Math.abs(det)<1e-12)throw Error('보정할 수 없는 선 배치입니다.');return [A,D,G,B,E,H,C,F,I].map(x=>x/det)}
  function plan(lines,width,height){
    const hs=lines.filter(l=>axis(l)==='h'),vs=lines.filter(l=>axis(l)==='v');
    if(hs.length!==2||vs.length!==2)throw Error('가로선 2개와 세로선 2개를 그어 주세요.');
    const yAt=l=>l.a.y+(width/2-l.a.x)*(l.b.y-l.a.y)/(l.b.x-l.a.x),xAt=l=>l.a.x+(height/2-l.a.y)*(l.b.x-l.a.x)/(l.b.y-l.a.y);
    hs.sort((a,b)=>yAt(a)-yAt(b));vs.sort((a,b)=>xAt(a)-xAt(b));
    const quad=[intersect(hs[0],vs[0]),intersect(hs[0],vs[1]),intersect(hs[1],vs[1]),intersect(hs[1],vs[0])];
    for(let i=0;i<4;i++){const p=quad[i],q=quad[(i+1)%4],r=quad[(i+2)%4];if((q.x-p.x)*(r.y-q.y)-(q.y-p.y)*(r.x-q.x)<=1e-6||distance(p,q)<10)throw Error('네 테두리가 서로 교차하지 않는 사각형을 이루도록 그어 주세요.')}
    const rw=(distance(quad[0],quad[1])+distance(quad[3],quad[2]))/2,rh=(distance(quad[0],quad[3])+distance(quad[1],quad[2]))/2;
    const m=homography(quad,[{x:0,y:0},{x:rw,y:0},{x:rw,y:rh},{x:0,y:rh}]);
    const corners=[{x:0,y:0},{x:width,y:0},{x:width,y:height},{x:0,y:height}],den=corners.map(p=>m[6]*p.x+m[7]*p.y+m[8]);
    if(den.some(d=>d<=1e-6))throw Error('이 선 배치는 이미지 바깥쪽 왜곡이 너무 큽니다. 학습지 바깥 테두리에 맞춰 다시 그어 주세요.');
    const transformed=corners.map(p=>point(m,p)),minX=Math.floor(Math.min(...transformed.map(p=>p.x))+1e-8),minY=Math.floor(Math.min(...transformed.map(p=>p.y))+1e-8),w=Math.ceil(Math.max(...transformed.map(p=>p.x))-1e-8)-minX,h=Math.ceil(Math.max(...transformed.map(p=>p.y))-1e-8)-minY;
    if(w<1||h<1||w>16384||h>16384||w*h>32000000)throw Error('보정 결과가 너무 큽니다. 기준선을 다시 맞추거나 원본 해상도를 줄여 주세요.');
    const full=[m[0]-minX*m[6],m[1]-minX*m[7],m[2]-minX*m[8],m[3]-minY*m[6],m[4]-minY*m[7],m[5]-minY*m[8],m[6],m[7],m[8]];
    return {matrix:full,inverse:inverse(full),w,h,quad};
  }
  return {axis,correctionAngle,intersect,homography,point,inverse,plan,distance};
})();
