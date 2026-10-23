import AppKit
import ImageIO
let root=FileManager.default.currentDirectoryPath
let names=["references/hd/3-照片-4.jpg","qa/ten-reference/04/iteration-scene04-mass164-r04/reference.png","qa/ten-reference/04/iteration-scene04-spatial188-r03-portal-personal-CC-BY-NC-SA4/reference.png"]
let images=try names.map{n -> CGImage in let url=URL(fileURLWithPath:root+"/"+n);guard let source=CGImageSourceCreateWithURL(url as CFURL,nil),let image=CGImageSourceCreateImageAtIndex(source,0,nil)else{throw NSError(domain:"read",code:1)};return image}
func comparison(_ output:String,_ crop:CGRect?)throws{
 let width=Int(crop?.width ?? 1254),height=Int(crop?.height ?? 1254)
 guard let c=CGContext(data:nil,width:width*3,height:height,bitsPerComponent:8,bytesPerRow:width*3*4,space:CGColorSpace(name:CGColorSpace.sRGB)!,bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)else{throw NSError(domain:"bitmap",code:2)}
 c.interpolationQuality = .none
 for (i,source) in images.enumerated(){let image=crop==nil ? source : source.cropping(to:crop!)!;precondition(image.width==width && image.height==height);c.draw(image,in:CGRect(x:i*width,y:0,width:width,height:height))}
 let url=URL(fileURLWithPath:root+"/lookdev/scene04-spatial188/"+output),dest=CGImageDestinationCreateWithURL(url as CFURL,"public.png" as CFString,1,nil)!
 CGImageDestinationAddImage(dest,c.makeImage()!,nil);precondition(CGImageDestinationFinalize(dest))
}
try comparison("reference-baseline-r03-native-unscaled-personal-CC-BY-NC-SA4.png",nil)
try comparison("reference-baseline-r03-portal-crops-unscaled-personal-CC-BY-NC-SA4.png",CGRect(x:250,y:110,width:760,height:500))
print("Three unscaled panels: HD4 supplied reference / held mass164R04 actual / spatial188R03 actual. Render panel CC BY-NC-SA4, personal noncommercial only; reference photo keeps separate rights.")
