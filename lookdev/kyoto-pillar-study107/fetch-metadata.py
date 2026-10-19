"""Reproduce the public metadata/thumbnail inspection; do not fetch geometry."""
from pathlib import Path
import json
import urllib.request
out=Path(__file__).resolve().parent
url='https://api.sketchfab.com/v3/models/f2422c6cffe849348f482ec2dd3e8ba2'
request=urllib.request.Request(url,headers={'User-Agent':'TempleCinema material study; public model metadata'})
raw=urllib.request.urlopen(request,timeout=20).read()
(out/'creator-metadata.json').write_bytes(raw)
data=json.loads(raw)
image=max(data['thumbnails']['images'],key=lambda item:item.get('width',0))
(out/'creator-thumbnail.jpg').write_bytes(urllib.request.urlopen(image['url'],timeout=20).read())
print(data['name'],data['license']['label'],'not selected')
