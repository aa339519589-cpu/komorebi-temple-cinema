"""Reference and actual WebGL render side by side; never an input to the scene."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageOps,ImageFont
root=Path(__file__).resolve().parents[1]
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',22)
folder=root/'qa/v3';folder.mkdir(exist_ok=True)
def pair(n,phase='end',w=750,h=560):
    out=Image.new('RGB',(w*2+24,h+45),(14,17,13));draw=ImageDraw.Draw(out)
    for col,path in enumerate([root/f'references/{n:02d}.png',root/f'qa/shot-{n:02d}-{phase}.png']):
        im=ImageOps.contain(Image.open(path).convert('RGB'),(w,h),Image.Resampling.LANCZOS)
        out.paste(im,(col*(w+24)+(w-im.width)//2,45+(h-im.height)//2))
    draw.text((12,10),f'{n:02d} REFERENCE',font=font,fill='#dacaa8')
    draw.text((w+36,10),f'{n:02d} CURRENT RENDER / {phase.upper()} / WORK IN PROGRESS',font=font,fill='#dacaa8')
    return out
for n in [4,6]:pair(n).save(folder/f'comparison-{n:02d}.jpg',quality=96)
for page in range(2):
    rows=[pair(n,w=600,h=448) for n in range(page*5+1,page*5+6)]
    sheet=Image.new('RGB',(1224,493*5),(14,17,13))
    for i,row in enumerate(rows):sheet.paste(row,(0,493*i))
    sheet.save(folder/f'comparisons-{page+1}.jpg',quality=93)
