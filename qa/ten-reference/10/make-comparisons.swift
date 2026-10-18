import AppKit
import ImageIO
let args=CommandLine.arguments
let root=args.count>1 ? args[1] : FileManager.default.currentDirectoryPath
let iteration=args.count>2 ? args[2] : "06"
func read(_ path:String)throws->CGImage{let u=URL(fileURLWithPath:path);guard let s=CGImageSourceCreateWithURL(u as CFURL,nil),let i=CGImageSourceCreateImageAtIndex(s,0,nil)else{throw NSError(domain:"image-read",code:1,userInfo:[NSLocalizedDescriptionKey:path])};return i}
let source=try read(root+"/references/hd/9-照片-10.jpg")
let actual=try read(root+"/qa/ten-reference/10/iteration-"+iteration+"/reference.png")
func compare(_ name:String,_ bounds:[Double],_ width:Int,_ height:Int)throws{
 let cs=CGColorSpaceCreateDeviceRGB();guard let c=CGContext(data:nil,width:width*2,height:height,bitsPerComponent:8,bytesPerRow:width*8,space:cs,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)else{throw NSError(domain:"context",code:2)}
 c.interpolationQuality = .high
 for (k,img) in [source,actual].enumerated(){let rect=CGRect(x:bounds[0]*Double(img.width),y:bounds[1]*Double(img.height),width:(bounds[2]-bounds[0])*Double(img.width),height:(bounds[3]-bounds[1])*Double(img.height));guard let cut=img.cropping(to:rect)else{continue};c.draw(cut,in:CGRect(x:k*width,y:0,width:width,height:height))}
 let out=c.makeImage()!;let url=URL(fileURLWithPath:root+"/qa/ten-reference/10/iteration-"+iteration+"/"+name+".png");let dest=CGImageDestinationCreateWithURL(url as CFURL,"public.png" as CFString,1,nil)!;CGImageDestinationAddImage(dest,out,nil);CGImageDestinationFinalize(dest)
}
try compare("original-left-render-right",[0,0,1,1],768,768)
try compare("crop-hall",[0.45,0.12,1,0.64],640,605)
try compare("crop-garden",[0.08,0.41,0.90,0.72],768,290)
try compare("crop-wet-stone",[0.08,0.70,0.92,1],768,274)
print("Compared original left / actual render right at iteration "+iteration)
