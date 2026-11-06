const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={Math,Error};vm.createContext(c);vm.runInContext(fs.readFileSync('dist/correction-math.js','utf8')+';this.math=CorrectionMath',c);const M=c.math;
const line=(a,b)=>({a:{x:a[0],y:a[1]},b:{x:b[0],y:b[1]}}),near=(a,b,eps=1e-6)=>assert(Math.abs(a-b)<eps,`${a} != ${b}`);
const top=line([160,100],[700,160]),right=line([700,160],[620,800]),bottom=line([90,700],[620,800]),left=line([160,100],[90,700]);
near(M.correctionAngle(top),-Math.atan2(60,540)*180/Math.PI);near(M.correctionAngle({a:top.b,b:top.a}),M.correctionAngle(top));near(M.correctionAngle(line([100,10],[100,800])),0);near(M.correctionAngle(line([10,100],[800,100])),0);
const plan=M.plan([left,bottom,right,top],800,900),q=plan.quad.map(p=>M.point(plan.matrix,p));near(q[0].y,q[1].y);near(q[2].y,q[3].y);near(q[0].x,q[3].x);near(q[1].x,q[2].x);
for(const p of [{x:0,y:0},{x:800,y:0},{x:800,y:900},{x:0,y:900}]){const out=M.point(plan.matrix,p);assert(out.x>=0&&out.x<=plan.w&&out.y>=0&&out.y<=plan.h);const back=M.point(plan.inverse,out);near(back.x,p.x);near(back.y,p.y)}
const backwards=[top,right,bottom,left].reverse().map(l=>({a:l.b,b:l.a})),p2=M.plan(backwards,800,900);near(p2.w,plan.w);near(p2.h,plan.h);
assert.throws(()=>M.plan([top,right,left],800,900));assert.throws(()=>M.plan([top,top,right,left],800,900));
const straight=M.plan([line([10,10],[90,10]),line([10,90],[90,90]),line([10,10],[10,90]),line([90,10],[90,90])],100,100);assert.equal(straight.w,100);assert.equal(straight.h,100);
function warp(data){let result;const context={self:{postMessage(v){if(v.buffer||v.error)result=v}},Uint8ClampedArray,Math};vm.createContext(context);vm.runInContext(fs.readFileSync('dist/correction-worker.js','utf8'),context);context.self.onmessage({data});assert(!result.error);return new Uint8ClampedArray(result.buffer)}
const src=new Uint8ClampedArray([255,0,0,255,0,255,0,255,0,0,255,255,255,255,255,0]);const output=warp({sw:2,sh:2,w:2,h:2,matrix:[1,0,0,0,1,0,0,0,1],buffer:src.buffer});assert.deepEqual([...output],[255,0,0,255,0,255,0,255,0,0,255,255,0,0,0,0]);
const shifted=warp({sw:2,sh:2,w:4,h:2,matrix:[1,0,-1,0,1,0,0,0,1],buffer:src.buffer});assert.equal(shifted[3],0);assert.equal(shifted[7],255);assert.equal(shifted[15],0);
const transparent=new Uint8ClampedArray([255,0,0,255,0,0,0,0]);const blend=warp({sw:2,sh:1,w:1,h:1,matrix:[1,0,.5,0,1,0,0,0,1],buffer:transparent.buffer});assert.equal(blend[0],255);assert.equal(blend[3],128);
console.log('PASS: horizontal/vertical detection, reversed stroke, four-line rectification in any order, full-image bounds, inverse mapping, invalid lines, identity warp, transparency, alpha-safe interpolation');
