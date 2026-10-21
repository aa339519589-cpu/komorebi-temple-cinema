from pathlib import Path
base=Path('lookdev/scene02-monumental-v2');s=(base/'render-physical161-r03.py').read_text().replace("HERE/'export-r03'","HERE/'export-r04'").replace("HERE/'cycles-r03'","HERE/'cycles-r04'").replace('physical161-r03','physical162-r04').replace('atmosphere161.exr','atmosphere162.exr')
s=s.replace("timber_ids={r['id'] for r in scene_data['materials'] if r['name'] in timber_names}","timber_ids={r['id'] for r in scene_data['materials'] if r['name'] in timber_names}\ngranite_names={'scene02-granite-terrace-bearing-courses','scene02-granite-individual-stair-treads','scene02-granite-stepped-stair-cheek','scene02-bridge-dark-rubble-core'}\ngranite_ids={r['id'] for r in scene_data['materials'] if r['name'] in granite_names}")
s=s.replace("    native_timber=any(mid in timber_ids for mid in record['materials']) and 'timberExtent' in data", "    native_timber=any(mid in timber_ids for mid in record['materials']) and 'timberExtent' in data\n    native_granite=any(mid in granite_ids for mid in record['materials']) and 'normal' in data")
s=s.replace('if shear>1e-7 or native_timber:', 'if shear>1e-7 or native_timber or native_granite:')
s=s.replace('if native_timber else None', 'if native_timber or native_granite else None')
needle="h=math.sin(float(transform[:3,3]@np.array([12.713,4.13,5.71])))*43758.5453;offset=h-math.floor(h);pair+=np.array([offset,offset*.37]);metric_uv[sl]=pair"
replace=needle+"""
            elif native_granite:
                scale=np.linalg.norm(transform[:3,:3],axis=0);pm=p*scale;nn=np.abs(data['normal']);pair=np.empty((vcount,2),dtype=np.float64);is_top=nn[:,1]>=np.maximum(nn[:,0],nn[:,2]);is_x=nn[:,0]>nn[:,2]
                pair[:,0]=np.where(is_top,pm[:,0],np.where(is_x,pm[:,2],pm[:,0]));pair[:,1]=np.where(is_top,pm[:,2],pm[:,1]);pair/=.3173828125
                h=math.sin(float(transform[:3,3]@np.array([9.23,3.17,4.71])))*12517.43;offset=h-math.floor(h);pair+=np.array([offset,offset*.39]);metric_uv[sl]=pair"""
assert needle in s;s=s.replace(needle,replace).replace('if native_timber:uv=metric_uv[faces.reshape(-1)]','if native_timber or native_granite:uv=metric_uv[faces.reshape(-1)]')
s=s.replace("'flattenedForShearedTransformsAndNativeMetricTimberUV':True", "'flattenedForShearedTransformsAndNativeMetricTimberAndGraniteUV':True")
s=s.replace("'roughness':'Native timber roughness remap ported;", "'graniteUV':'Original native position/normal and actual instance-column lengths choose the dominant-face metric UV at0.3173828125m per original granite map; native phase formula is recomputed in CPU double precision, so sin/fract phase can differ from native GPU float rounding. Original UV buffers and texture bytes remain in the verified export.',\n 'roughness':'Native timber roughness remap ported;")
(base/'render-physical162-r04.py').write_text(s)
