# Comparison-only raster measurement overlay. Never loaded by the 3D scene.
import subprocess, pathlib, json, zlib, struct, binascii, hashlib, os
HERE=pathlib.Path('qa/ten-reference/06/floor100-observations').resolve()
ROOT=pathlib.Path(os.environ.get('FLOOR_COMPARISON_ROOT', str(HERE.parents[3])))
FONT={
'0':['111','101','101','101','111'],'1':['010','110','010','010','111'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','010','010','010'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111'],'-':['000','000','111','000','000']}
def png(path,w,h,data):
 def chunk(t,d):return struct.pack('>I',len(d))+t+d+struct.pack('>I',binascii.crc32(t+d)&0xffffffff)
 scan=b''.join(b'\0'+data[y*w*4:(y+1)*w*4] for y in range(h))
 path.write_bytes(b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',w,h,8,6,0,0,0))+chunk(b'IDAT',zlib.compress(scan))+chunk(b'IEND',b''))
def overlay(path,name,points=None):
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-frames:v','1','-f','rawvideo','-pix_fmt','rgba','pipe:1'])
 assert len(raw)==1254*1254*4
 x0,y0,cw,ch,s=0,844,1254,410,1;w,h=cw*s,ch*s;out=bytearray(w*h*4)
 for y in range(h):
  for x in range(w):
   src=((y//s+y0)*1254+x//s+x0)*4;i=(y*w+x)*4;out[i:i+4]=raw[src:src+4]
 def pixel(x,y,c):
  if 0<=x<w and 0<=y<h:out[(y*w+x)*4:(y*w+x)*4+4]=bytes(c)
 def line(xa,ya,xb,yb,c):
  n=max(abs(xa-xb),abs(ya-yb));n=max(1,n)
  for j in range(n+1):pixel(round(xa+(xb-xa)*j/n),round(ya+(yb-ya)*j/n),c)
 def text(x,y,value,c=(255,255,255,255)):
  for digit in str(value):
   for yy,row in enumerate(FONT[digit]):
    for xx,p in enumerate(row):
     if p=='1':
      for a in range(2):
       for b in range(2):pixel(x+xx*2+a,y+yy*2+b,c)
   x+=8
 for gx in range(100,1254,100):
  xx=(gx-x0)*s;line(xx,0,xx,h-1,(45,140,155,255))
  if gx%50==0:text(xx+3,3,gx)
 for gy in range(850,1254,50):
  yy=(gy-y0)*s;line(0,yy,w-1,yy,(45,140,155,255))
  if gy%50==0:text(3,yy+3,gy)
 if points:
  for j,p in enumerate(points):
   x,y=[round(v) for v in p['xy']];xx=(x-x0)*s;yy=(y-y0)*s;c=(255,45,190,255)
   line(xx-7,yy,xx+7,yy,c);line(xx,yy-7,xx,yy+7,c);text(xx+7,yy+5,p.get("idIndex",j),c)
 png(HERE/(name+'.png'),w,h,out)
 return hashlib.sha256(path.read_bytes()).hexdigest()

overlay(ROOT/'references/hd/4-照片-5.jpg','reference-floor-grid')
