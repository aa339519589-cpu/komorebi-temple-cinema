// Numerical evidence for HDR reflection failures. Only used when explicitly
// requested by offline diagnostics; it does not alter lighting or material data.
export function auditHalfFloatTarget(renderer, target, faces = [undefined]) {
  const results=[];
  for(const face of faces){
    const data=new Uint16Array(target.width*target.height*4);
    renderer.readRenderTargetPixels(target,0,0,target.width,target.height,data,face);
    let nan=0,infinite=0,zero=0,negative=0,finite=0,min=Infinity,max=-Infinity,sum=0;
    const invalidPixels=new Map();
    for(let i=0;i<data.length;i++){
      if(i%4===3)continue;
      const word=data[i],exponent=(word>>10)&31,mantissa=word&1023;
      if(exponent===31){if(mantissa)nan++;else infinite++;const pixel=Math.floor(i/4);if(invalidPixels.size<24)invalidPixels.set(pixel,{x:pixel%target.width,y:Math.floor(pixel/target.width)});continue;}
      const value=(word&32768?-1:1)*(exponent===0?mantissa/1024*2**-14:(1+mantissa/1024)*2**(exponent-15));
      finite++;if(value===0)zero++;if(value<0)negative++;min=Math.min(min,value);max=Math.max(max,value);sum+=value;
    }
    results.push({face:face??null,width:target.width,height:target.height,rgbSamples:target.width*target.height*3,
      nan,infinite,zero,negative,finite,invalidPixels:[...invalidPixels.values()],min:finite?min:null,max:finite?max:null,mean:finite?sum/finite:null,glError:renderer.getContext().getError()});
  }
  return results;
}
