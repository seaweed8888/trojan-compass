"""Build the simple Trojan map figure with Blender 4.3.
Run: blender --background --factory-startup --python scripts/build-tommy.py -- --render
Uses the user-provided character template with a locally authored Trojan helmet.
"""
import bpy
import bmesh
import math
import sys
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'web/public/models/tommy-trojan.glb'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def xyz(p):
    return (p[0],-p[2],p[1])

GOLD=(1,.604,0,1)  # Linear RGB for USC gold #FFCC00.
CARDINAL=(.32,.008,.018,1)
BRONZE=(.48,.265,.075,1)
material=bpy.data.materials.new('Trojan guide vertex colors')
material.use_nodes=True
material.use_backface_culling=True
shader=material.node_tree.nodes.get('Principled BSDF')
shader.inputs['Roughness'].default_value=.58
color=material.node_tree.nodes.new('ShaderNodeVertexColor')
color.layer_name='Color'
material.node_tree.links.new(color.outputs['Color'],shader.inputs['Base Color'])
bronze=material.copy()
bronze.name='Brushed bronze helmet'
bronze.node_tree.nodes.get('Principled BSDF').inputs['Metallic'].default_value=.65
bronze.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.36

def finish(obj,name,color):
    obj.name=name
    obj.data.materials.append(bronze if color==BRONZE else material)
    for face in obj.data.polygons:face.use_smooth=True
    attribute=obj.data.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER')
    for corner in attribute.data:corner.color=color
    return obj

def mesh(name,vertices,faces,color):
    data=bpy.data.meshes.new(name)
    data.from_pydata([xyz(v) for v in vertices],[],faces)
    data.update()
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj)
    return finish(obj,name,color)

def pivot(name,at,parts):
    group=bpy.data.objects.new(name,None)
    bpy.context.collection.objects.link(group)
    group.location=xyz(at)
    bpy.context.view_layer.update()
    for obj in parts:
        world=obj.matrix_world.copy()
        obj.parent=group
        obj.matrix_world=world
    return group

bpy.ops.import_scene.gltf(filepath=str(ROOT/'scripts/assets/animal_crossing_character.glb'))
bpy.context.view_layer.update()
source_meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
assert {o.name for o in source_meshes}=={f'Object_{i}' for i in range(2,10)}
for obj in source_meshes:
    if obj.name=='Object_8':
        bpy.data.objects.remove(obj,do_unlink=True)
        continue
    world=obj.matrix_world.copy()
    for vertex in obj.data.vertices:
        p=world@vertex.co
        if obj.name in ['Object_2','Object_5','Object_6']:
            side=-1 if p.x<0 else 1
            t=max(0,min(1,(abs(p.x)-.34)/.23))
            angle=-side*math.radians(72)*t*t*(3-2*t)
            dx=p.x-side*.36; dz=p.z-1.70
            p.x=side*.36+math.cos(angle)*dx-math.sin(angle)*dz+side*.22*t
            p.z=1.70+math.sin(angle)*dx+math.cos(angle)*dz
        vertex.co=Vector((p.x*.60,p.y*.60,(p.z-.008)*.60))
    obj.parent=None;obj.matrix_world=Matrix.Identity(4)
    obj.data.materials.clear()
    for attr in list(obj.data.color_attributes):obj.data.color_attributes.remove(attr)
    source_name=obj.name
    finish(obj,'Template '+obj.name,GOLD)
    if source_name in ['Object_2','Object_3','Object_4']:
        shell=obj.modifiers.new('Close template garment surfaces','SOLIDIFY');shell.thickness=.045;shell.offset=0
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH':bpy.data.objects.remove(obj,do_unlink=True)
for side in [-1,1]:
    pivot('ArmL' if side<0 else 'ArmR',(side*.216,1.015,0),[])
    pivot('LegL' if side<0 else 'LegR',(side*.13,.49,0),[])

before=set(bpy.data.objects)
# Corinthian shell: raised brow, lowered rear edge, and a flared nape skirt.
vertices=[]
for j in range(8):
    a=j*math.pi/14
    for i in range(24):
        angle=i*math.tau/24
        brow=.065*math.cos(angle)*math.cos(a)**2
        vertices.append((.25*math.cos(a)*math.sin(angle),1.78+.26*math.sin(a)+brow,.248*math.cos(a)*math.cos(angle)))
helmet=mesh('Bronze domed shell',vertices,[(j*24+i,j*24+(i+1)%24,(j+1)*24+(i+1)%24,(j+1)*24+i) for j in range(7) for i in range(24)],BRONZE)
solid=helmet.modifiers.new('Helmet shell','SOLIDIFY');solid.thickness=.012

def plate(name,vertices,faces):
    obj=mesh(name,vertices,faces,BRONZE)
    solid=obj.modifiers.new('Forged plate thickness','SOLIDIFY');solid.thickness=.012
    bevel=obj.modifiers.new('Rounded metal edges','BEVEL');bevel.width=.004;bevel.segments=2
    return obj

vertices=[]
for j in range(3):
    for i in range(17):
        a=math.pi/3+i*math.pi/12
        r=.25+(.035 if j==2 else 0)
        vertices.append((r*math.sin(a),1.78+.065*math.cos(a)-j*.065,r*math.cos(a)))
plate('Flared neck guard',vertices,[(j*17+i,j*17+i+1,(j+1)*17+i+1,(j+1)*17+i) for j in range(2) for i in range(16)])
for side in [-1,1]:
    # Curved plates follow the cheeks and taper toward the open mouth.
    outline=[(.245,1.80,.045),(.202,1.754,.152),(.08,1.728,.231),(.105,1.552,.20),(.184,1.525,.128),(.253,1.65,-.02)]
    vertices=[(side*x,y,z) for x,y,z in outline]+[(side*.218,1.675,.134)]
    plate('Shaped cheek plate',vertices,[(i,(i+1)%6,6) for i in range(6)])
plate('Tapered nasal guard',[(-.039,1.852,.245),(.039,1.852,.245),(.023,1.696,.258),(0,1.68,.265),(-.023,1.696,.258)],[(0,1,2,3,4)])

# Radial ridges suggest horsehair without alpha textures or individual strands.
def crest_band(name,inner,outer,width,color):
    vertices=[]
    steps=32
    for i in range(steps+1):
        t=i/steps
        a=.65+t*2.60
        for r,x in [(inner,-width),(outer,-width*.72),(outer,width*.72),(inner,width)]:
            ridge=.002*(i%2) if r==outer else 0
            swept=a+(.28*t**3 if r==outer and color==CARDINAL else 0)
            vertices.append((x,1.78+(r+ridge)*math.sin(swept),(r+ridge)*math.cos(swept)-.035*math.sin(swept)))
    faces=[(i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j) for i in range(steps) for j in range(4)]
    faces.extend([(3,2,1,0),tuple(range(steps*4,steps*4+4))])
    obj=mesh(name,vertices,faces,color)
    if color==CARDINAL:
        attribute=obj.data.color_attributes['Color']
        for face in obj.data.polygons:
            tint=.90 if (face.index//4)%2 else 1.05
            for loop in face.loop_indices:attribute.data[loop].color=tuple(c*tint for c in CARDINAL[:3])+(1,)
    return obj
crest_band('Bronze crest holder',.255,.285,.029,BRONZE)
crest=crest_band('Swept cardinal horsehair',.28,.40,.036,CARDINAL)
# The thin crest runs along the nose-to-nape axis, never across the ears.
assert max(v.co.x for v in crest.data.vertices)-min(v.co.x for v in crest.data.vertices)<.08
assert max(v.co.y for v in crest.data.vertices)-min(v.co.y for v in crest.data.vertices)>.5
helmet_parts=set(bpy.data.objects)-before
for obj in helmet_parts:
    for vertex in obj.data.vertices:
        x,y,z=vertex.co
        vertex.co=(x*1.85,y*1.85,1.50+(z-1.735)*1.85)
pivot('Head',(0,1.12,.025),helmet_parts)

# Fuse the skin before rigging so shoulders cannot separate during the carry loop.
pivots={o.name:o.location.copy() for o in bpy.context.scene.objects if o.type=='EMPTY'}
pivots.update({name:Vector(xyz(at)) for name,at in {
    'Hips':(0,.49,0),'Spine':(0,.85,0),
    'ForearmL':(-.31,.78,0),'ForearmR':(.31,.78,0),
    'ShinL':(-.13,.27,0),'ShinR':(.13,.27,0),
    'FootL':(-.13,.075,.025),'FootR':(.13,.075,.025),
}.items()})
skin=[]
armor=[]
for obj in list(bpy.context.scene.objects):
    if obj.type!='MESH':continue
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True);bpy.context.view_layer.objects.active=obj
    for mod in list(obj.modifiers):bpy.ops.object.modifier_apply(modifier=mod.name)
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=bm.verts[:],dist=.00001)
    bmesh.ops.recalc_face_normals(bm,faces=bm.faces[:])
    bm.to_mesh(obj.data);bm.free()
    assert all(math.isfinite(v) for vertex in obj.data.vertices for v in vertex.co)
    world=obj.matrix_world.copy();obj.parent=None;obj.matrix_world=world
    (skin if obj.data.materials[0]==material and not obj.name.startswith('Swept') else armor).append(obj)
for obj in list(bpy.context.scene.objects):
    if obj.type=='EMPTY':bpy.data.objects.remove(obj,do_unlink=True)

def join(parts):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in parts:obj.select_set(True)
    bpy.context.view_layer.objects.active=parts[0]
    if len(parts)>1:bpy.ops.object.join()
    return bpy.context.object

body=join(skin)
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
remesh=body.modifiers.new('Continuous skin','REMESH');remesh.mode='VOXEL';remesh.voxel_size=.022
bpy.ops.object.modifier_apply(modifier=remesh.name)
smooth=body.modifiers.new('Soft shoulder blends','SMOOTH');smooth.factor=1; smooth.iterations=8
bpy.ops.object.modifier_apply(modifier=smooth.name)
decimate=body.modifiers.new('Map triangle budget','DECIMATE')
decimate.ratio=min(1,3000/sum(len(p.vertices)-2 for p in body.data.polygons))
bpy.ops.object.modifier_apply(modifier=decimate.name)
body.data.materials.clear()
for attr in list(body.data.color_attributes):body.data.color_attributes.remove(attr)
finish(body,'Continuous gold figure',GOLD)
# Check that all limbs and the head belong to the same welded surface.
bm=bmesh.new();bm.from_mesh(body.data)
bm.verts.ensure_lookup_table()
seen=set();pending=[bm.verts[0]]
while pending:
    v=pending.pop()
    if v in seen:continue
    seen.add(v);pending.extend(e.other_vert(v) for e in v.link_edges)
assert len(seen)==len(bm.verts),'Disconnected skin'
assert all(e.is_manifold for e in bm.edges),'Open skin surface'
bm.free()

def blend(lo,hi,value):
    t=max(0,min(1,(value-lo)/(hi-lo)))
    return t*t*(3-2*t)

for name in ['Root',*pivots]:body.vertex_groups.new(name=name)
for v in body.data.vertices:
    x,z,y=v.co.x,-v.co.y,v.co.z
    head=blend(1.08,1.23,y)
    arm=blend(.255,.315,abs(x))*(1-blend(1.00,1.13,y))*(1-head)
    leg=(1-blend(.32,.54,y))*(1-head-arm)
    side='L' if x<0 else 'R'
    elbow=1-blend(.69,.84,y)
    knee=1-blend(.22,.34,y)
    ankle=1-blend(.07,.14,y)
    torso=1-head-arm-leg
    chest=blend(.58,.95,y)
    weights={'Head':head,'Arm'+side:arm*(1-elbow),'Forearm'+side:arm*elbow,
        'Leg'+side:leg*(1-knee),'Shin'+side:leg*knee*(1-ankle),'Foot'+side:leg*knee*ankle,
        'Hips':torso*(1-chest),'Spine':torso*chest}
    for name,w in weights.items():
        if w>0:body.vertex_groups[name].add([v.index],w,'REPLACE')
for obj in armor:
    group=obj.vertex_groups.new(name='Head');group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
body=join([body,*armor]);body.name='Trojan guide'
floor_offset=-min(v.co.z for v in body.data.vertices)
for v in body.data.vertices:v.co.z+=floor_offset
for at in pivots.values():at.z+=floor_offset
rig_data=bpy.data.armatures.new('Guide skeleton')
rig=bpy.data.objects.new('Guide rig',rig_data);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
root=rig_data.edit_bones.new('Root');root.head=(0,0,0);root.tail=(0,0,.12)
for name,at in pivots.items():
    bone=rig_data.edit_bones.new(name);bone.head=at;bone.tail=at+Vector((0,0,.12))
for bone in list(rig_data.edit_bones):
    if bone.name=='Root':continue
    name=bone.name
    parent='Arm'+name[-1] if name.startswith('Forearm') else 'Leg'+name[-1] if name.startswith('Shin') else 'Shin'+name[-1] if name.startswith('Foot') else 'Spine' if name.startswith('Arm') or name=='Head' else 'Hips' if name.startswith('Leg') or name=='Spine' else 'Root'
    bone.parent=rig_data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')
body.parent=rig
deform=body.modifiers.new('Smooth carry deformation','ARMATURE');deform.object=rig

objects=[o for o in bpy.context.scene.objects if o.type=='MESH']
bpy.context.view_layer.update()
bounds=[o.matrix_world@Vector(c) for o in objects for c in o.bound_box]
height=max(p.z for p in bounds)-min(p.z for p in bounds)
triangles=sum(len(p.vertices)-2 for o in objects for p in o.data.polygons)
assert len(objects)==1
assert triangles<6000,triangles
assert 2.30<height<2.45,height
assert all(rig.data.bones.get(n) for n in ['Head','ArmL','ArmR','LegL','LegR'])
OUT.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_yup=True)
assert OUT.stat().st_size<200000
print(f'Trojan guide: {triangles:,} triangles, {len(objects)} meshes, {height:.3f} units, {OUT.stat().st_size:,} bytes',flush=True)

if '--render' in sys.argv:
    scene=bpy.context.scene
    scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.world.color=(.3,.3,.3)
    scene.view_settings.view_transform='AgX'
    for location,energy,size in [((3,-4,6),450,4),((-3,-2,3),220,3),((1,3,4),450,3)]:
        bpy.ops.object.light_add(type='AREA',location=location)
        light=bpy.context.object;light.data.energy=energy;light.data.shape='DISK';light.data.size=size
        light.rotation_euler=(Vector((0,0,1.2))-light.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(3,-6,2.8))
    camera=bpy.context.object
    camera.rotation_euler=(Vector((0,0,1.2))-camera.location).to_track_quat('-Z','Y').to_euler()
    camera.data.type='ORTHO';camera.data.ortho_scale=2.85
    scene.camera=camera
    scene.render.resolution_x=700;scene.render.resolution_y=850;scene.render.resolution_percentage=100
    scene.render.film_transparent=True
    scene.render.filepath=str(OUT.with_suffix('.png'))
    bpy.ops.render.render(write_still=True)
