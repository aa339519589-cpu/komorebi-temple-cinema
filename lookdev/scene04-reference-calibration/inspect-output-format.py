import bpy,json
r=[]
for p in bpy.context.scene.render.image_settings.bl_rna.properties:
    if any(k in p.identifier for k in ['format','type','layer','exr']):
        r.append({'name':p.identifier,'value':str(getattr(bpy.context.scene.render.image_settings,p.identifier,None)),'enum':[i.identifier for i in p.enum_items] if p.type=='ENUM' else None})
print('OUTPUT_FORMAT_METADATA',json.dumps(r),flush=True)
