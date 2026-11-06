// Inverse projective resampling, bilinear interpolation in premultiplied alpha.
self.onmessage=({data})=>{
  try{
    const {sw,sh,w,h,matrix:m,buffer}=data,src=new Uint8ClampedArray(buffer),out=new Uint8ClampedArray(w*h*4);
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const px=x+.5,py=y+.5,d=m[6]*px+m[7]*py+m[8];if(Math.abs(d)<1e-10)continue;
        let sx=(m[0]*px+m[1]*py+m[2])/d-.5,sy=(m[3]*px+m[4]*py+m[5])/d-.5;
        if(sx<-.5||sy<-.5||sx>sw-.5||sy>sh-.5)continue;
        sx=Math.max(0,Math.min(sw-1,sx));sy=Math.max(0,Math.min(sh-1,sy));
        const x0=Math.floor(sx),y0=Math.floor(sy),x1=Math.min(sw-1,x0+1),y1=Math.min(sh-1,y0+1),fx=sx-x0,fy=sy-y0;
        const n00=(y0*sw+x0)*4,n10=(y0*sw+x1)*4,n01=(y1*sw+x0)*4,n11=(y1*sw+x1)*4;
        const a00=src[n00+3]*(1-fx)*(1-fy),a10=src[n10+3]*fx*(1-fy),a01=src[n01+3]*(1-fx)*fy,a11=src[n11+3]*fx*fy,alpha=a00+a10+a01+a11;
        const n=(y*w+x)*4;if(alpha){out[n]=(src[n00]*a00+src[n10]*a10+src[n01]*a01+src[n11]*a11)/alpha;out[n+1]=(src[n00+1]*a00+src[n10+1]*a10+src[n01+1]*a01+src[n11+1]*a11)/alpha;out[n+2]=(src[n00+2]*a00+src[n10+2]*a10+src[n01+2]*a01+src[n11+2]*a11)/alpha;out[n+3]=alpha}
      }
      if(y%128===0)self.postMessage({progress:Math.round(y/h*100)});
    }
    self.postMessage({buffer:out.buffer,w,h},[out.buffer]);
  }catch(e){self.postMessage({error:e.message||'이미지 보정에 실패했습니다.'})}
};
