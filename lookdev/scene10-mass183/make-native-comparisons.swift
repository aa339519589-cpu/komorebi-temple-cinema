import AppKit
import ImageIO
let root=FileManager.default.currentDirectoryPath
let names=["references/hd/9-照片-10.jpg","qa/ten-reference/10/iteration-scene10-monumental-rain142-r07-ground-20261022/reference.png","qa/ten-reference/10/iteration-scene10-mass183-r03-hall/reference.png"]
let images=try names.map{n -> CGImage in let url=URL(fileURLWithPath:root+"/"+n);guard let source=CGImageSourceCreateWithURL(url as CFURL,nil),let image=CGImageSourceCreateImageAtIndex(source,0,nil)else{throw NSError(domain:"read",code:1)};return image}
func comparison(_ output:String,_ crop:CGRect?)throws{
 let width=Int(crop?.width ?? 1254),height=Int(crop?.height ?? 1254)
 guard let c=CGContext(data:nil,width:width*3,height:height,bitsPerComponent:8,bytesPerRow:width*3*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)else{throw NSError(domain:"bitmap",code:2)}
 c.interpolationQuality = .none
 for (i,source) in images.enumerated(){let image=crop==nil ? source : source.cropping(to:crop!)!;precondition(image.width==width && image.height==height);c.draw(image,in:CGRect(x:i*width,y:0,width:width,height:height))}
 let url=URL(fileURLWithPath:root+"/lookdev/scene10-mass183/"+output),dest=CGImageDestinationCreateWithURL(url as CFURL,"public.png" as CFString,1,nil)!
 CGImageDestinationAddImage(dest,c.makeImage()!,nil);precondition(CGImageDestinationFinalize(dest))
}
try comparison("reference-baseline-r03-native-unscaled.png",nil)
try comparison("reference-baseline-r03-hall-crops-unscaled.png",CGRect(x:588,y:132,width:660,height:660))
print("Three unscaled panels: HD10 reference / held R142R07 actual / R03 actual. No camera or pixel scale changes.")
