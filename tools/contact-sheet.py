"""Create comparison sheets from actual rendered video frames. Pillow is a QA dependency only."""
from PIL import Image, ImageDraw
from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[1]
subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(root/'output/komorebi-70s.mp4'),'-vf',"select='eq(mod(n,210),204)'",'-fps_mode','vfr',str(root/'qa/final-%02d.png')],check=True)
# Create full-size contact sheet separately to preserve the thumbnail aspect ratio.
sheet=Image.new('RGB',(1500,5*445),(14,17,14));draw=ImageDraw.Draw(sheet)
for i in range(10):
    im=Image.open(root/f'qa/final-{i+1:02d}.png').resize((740,416),Image.Resampling.LANCZOS);x=i%2*750;y=i//2*445;sheet.paste(im,(x,y+24));draw.text((x+9,y+5),f'{i+1:02d}  KOMOREBI',fill='#d9c698')
sheet.save(root/'output/contact-sheet.jpg',quality=94)
