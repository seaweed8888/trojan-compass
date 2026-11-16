#!/usr/bin/env python3
"""Author the non-LAW reconstruction as explicit LAW-compatible floor tuples.

Python standard library only. Runtime rendering has no dependency on this script.
Local scene units are approximately 2m. All generated coordinates are inferred.
The campus polygons are rotated into building axes; slabs simplify small ledges.
"""
import json
import re
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'server/src/infrastructure/datasets/prototype/interiors'
RF = 'https://roomfinder.usc.edu/ (indexed classroom table, retrieved 2026-11-14)'
LVL = 'https://libraries.usc.edu/sites/default/files/2023-10/Leavey_Library_tour_guide.pdf'
DML = 'https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf'
TCC = 'https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/'
MEET = 'https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/'
KAP = 'https://bpb-us-w1.wpmucdn.com/sites.usc.edu/dist/f/100/files/2018/02/r2_CE_13_01_Ebrahimian_and_Trifunac_KAP_Vib_tests-vmv6a6.pdf'
SGM = 'https://dornsife.usc.edu/usc-psc/client-hub/directions-to-sgm/'
SAL = 'https://planning.lacity.gov/eir/USC/FEIR/files/USC%20Appendix%20C-1%20Supplemental%20Historic%20Resources%20Report.pdf'
VKC = 'https://cityclerk.lacity.org/onlinedocs/2013/13-1464-s8_rpt_chc_10-28-2013.pdf'
MAP = 'demos/usc-map/locations.json'
OLD = 'Original server/src/infrastructure/datasets/prototype/floorplan.ts template (unverified demo IDs only)'

def ev(number='', source=None, confirmed=False, notes='', identity=False, access=False):
    e = dict(numberStatus='confirmed' if confirmed else 'inferred' if number else 'not applicable',
             positionStatus='inferred', identityStatus='confirmed' if identity or confirmed else 'inferred',
             sources=([source] if isinstance(source,str) else source) or [OLD],
             notes=('Position, boundary and door inferred. ' + notes).strip())
    if access: e['accessibilityStatus'] = 'inferred'
    return e

def room(number, name, source=None, capacity=None, confirmed=False, notes='', identity=False, kind='r'):
    return dict(number=str(number), name=name, source=source, capacity=capacity, confirmed=confirmed,
                notes=notes, identity=identity, kind=kind)

def known(table):
    return [room(n, 'Auditorium' if cap >= 74 else 'Classroom', RF, cap, True,
                 'Room existence/number/capacity from indexed USC Room Finder; floor inferred from number prefix. Descriptive label Auditorium (74+ seats) or Classroom inferred from capacity, not an official room name.') for n, cap in table]

def legacy(floor, purpose, existing=()):
    numbers={r['number'] for r in existing}
    candidates=[str(floor*100+i) if floor else f'B{i:02}' for i in range(1,11)]
    return [room(number, purpose, OLD, notes='Retained legacy demo number; number and use inferred.' if floor else 'Basement number and use inferred; B-prefix follows supplied basement numbering where available.')
            for number in candidates if number not in numbers]

def pg(p): return [round(630-p[1]*30,3),round(930+p[0]*30,3)]
def pr(r):
    x0,z0,x1,z1=r
    return [round(630-z1*30,3),round(930+x0*30,3),round(630-z0*30,3),round(930+x1*30,3)]

def projected(p, walks):
    best=None
    for line in walks:
        for a,b in zip(line,line[1:]):
            dx,dz=b[0]-a[0],b[1]-a[1]; den=dx*dx+dz*dz
            t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/den))
            q=[round(a[0]+t*dx,3),round(a[1]+t*dz,3)]
            d=(q[0]-p[0])**2+(q[1]-p[1])**2
            if best is None or d<best[0]:best=(d,q)
    return best[1]

def make_floor(code, level, slabs, walks, entries, zones, cores, name=None, notes='', source=None, voids=()):
    """Zones are authored per building: (rect, door side, partition axis, room count)."""
    floor=dict(level=level,name=name or ('Basement' if level==0 else f'Floor {level}'),
               slabs=[pr(r) for r in slabs], rooms=[], walks=[], entrances=[], records=[],
               evidence=ev(source=source or MAP,notes='Whole floor geometry inferred. '+notes),
               entranceEvidence={},voids=list(voids))
    lines=[[list(p) for p in line] for line in walks]
    def cell(number,title,kind,rect,side,evidence,capacity=None,id=None,restroom=None):
        x0,z0,x1,z1=rect;cx=(x0+x1)/2;cz=(z0+z1)/2
        door={'N':[cx,z0],'S':[cx,z1],'W':[x0,cz],'E':[x1,cz]}[side]
        # inverse of LAW's page rotation
        page_side={'N':'E','S':'W','W':'N','E':'S'}[side]
        floor['rooms'].append([number,title,kind,pr(rect),page_side,None,title if not number else None])
        record=dict(id=id or f'{code}-{number}',evidence=evidence)
        if capacity is not None:record['capacity']=capacity
        if restroom:record['restroom']=restroom
        floor['records'].append(record)
        q=projected(door,walks)
        if q!=door:lines.append([q,door])
    cursor=0
    for rect,side,axis,count in zones:
        rs=entries[cursor:cursor+count];cursor+=count
        if not rs:continue
        # Relative sizes are inferred, using confirmed capacities only as a rough cue.
        weights=[max(1,(r.get('capacity') or 32)/32)**0.5 for r in rs]
        total=sum(weights);at=rect[0 if axis=='x' else 1]
        end=rect[2 if axis=='x' else 3]
        start=at
        for r,weight in zip(rs,weights):
            nxt=at+(end-start)*weight/total
            box=rect.copy();box[0 if axis=='x' else 1]=round(at,3);box[2 if axis=='x' else 3]=round(nxt,3)
            cell(r['number'],r['name'],r['kind'],box,side,
                 ev(r['number'],r['source'],r['confirmed'],r['notes'],r['identity']),r['capacity'])
            at=nxt
    if cursor<len(entries):raise ValueError((code,level,'unplaced rooms',len(entries)-cursor))
    for key,title,kind,rect,side in cores:
        cell('',title,kind,rect,side,ev(source=source or MAP,notes='Core alignment and floor service inferred. Accessibility and evacuation suitability unverified.',access=True),
             id=f'{code}-{level}-{key}',restroom='both' if kind=='w' else None)
    if level==1:
        # Entrances terminate on the slab boundary. No implied surveyed step-free claim.
        for key,p,title,entrance in [('entrance',walks[0][0],'main entrance',True),('exit',walks[0][-1],'secondary exit',False)]:
            floor['entrances'].append(dict(id=key,at=pg(p),label=title,stepFree=True,entrance=entrance))
            floor['entranceEvidence'][key]=ev(source=MAP,notes='Door location and step-free property inferred; not a verified accessible entrance or emergency exit.',access=True)
    floor['walks']=[[pg(p) for p in line] for line in lines]
    return floor

def distribute(entries, zones):
    """Allocate rooms to explicitly chosen bands, preserving different building shapes."""
    areas=[(r[2]-r[0])*(r[3]-r[1]) for r,_,_ in zones]
    counts=[int(len(entries)*a/sum(areas)) for a in areas]
    for i in sorted(range(len(areas)),key=lambda i:len(entries)*areas[i]/sum(areas)-counts[i],reverse=True)[:len(entries)-sum(counts)]:counts[i]+=1
    return [(*z,c) for z,c in zip(zones,counts)]

all_specs={}
def outline(floor, angle):
    rects=[[(r[1]-930)/30,(630-r[2])/30,(r[3]-930)/30,(630-r[0])/30] for r in floor['slabs']]
    xs=sorted({r[i] for r in rects for i in [0,2]});zs=sorted({r[i] for r in rects for i in [1,3]})
    edges=set()
    for a,c in zip(xs,xs[1:]):
        for b,d in zip(zs,zs[1:]):
            if not any(x0<=(a+c)/2<=x1 and z0<=(b+d)/2<=z1 for x0,z0,x1,z1 in rects):continue
            vs=[(a,b),(c,b),(c,d),(a,d)]
            for p,q in zip(vs,vs[1:]+vs[:1]):
                if (q,p) in edges:edges.remove((q,p))
                else:edges.add((p,q))
    start=min(edges)[0];points=[start];current=start
    while True:
        edge=next(e for e in edges if e[0]==current);edges.remove(edge);current=edge[1]
        if current==start:break
        points.append(current)
    assert not edges, 'Each footprint must have one connected outer boundary; courtyards are open U recesses.'
    simple=[]
    for i,p in enumerate(points):
        prev=points[i-1];nxt=points[(i+1)%len(points)]
        if (p[0]-prev[0])*(nxt[1]-p[1]) != (p[1]-prev[1])*(nxt[0]-p[0]):simple.append(p)
    a=math.radians(angle);rotated=[(x*math.cos(a)+z*math.sin(a),-x*math.sin(a)+z*math.cos(a)) for x,z in simple]
    x0=min(p[0] for p in rotated);x1=max(p[0] for p in rotated);z0=min(p[1] for p in rotated);z1=max(p[1] for p in rotated)
    scale=12/max(x1-x0,z1-z0)
    return [[round((x-(x0+x1)/2)*scale,3),round((z-(z0+z1)/2)*scale,3)] for x,z in rotated]

def building(code,name,aliases,status,count_notes,shape_notes,floors,angle=-28):
    all_specs[code]=dict(code=code,name=name,aliases=aliases,floorCountStatus=status,floorCountNotes=count_notes,
        shapeSource=f'{MAP}: '+('DMC' if code=='VKC' else code)+' paths; '+shape_notes.split(' | ')[0],
        shapeNotes=shape_notes,orientationDegrees=angle,footprint=outline(next(f for f in floors if f['level']==1),angle),floors=floors)

# DML: broad reading-room wings around a central stack block; recessed west edge.
# Internal levels stay compatible with the viewer: 0=B, 1=Ground, 2=First, 3=Second.
dml_slabs=[[-18,-13.5,17.5,-8.5],[-11.8,-8.5,19.5,7.5],[-18,7.5,19.5,12.5]]
dml_walks=[[[-18,-10.5],[0,-10.5],[17.5,-10.5]],[[0,-10.5],[0,10]],[[0,10],[-18,10]],[[0,10],[19.5,10]],[[0,0],[19.5,0]]]
dml_cores=[('SA','West stairs','s:A',[-17.5,-13,-14,-11.5],'S'),('SB','South stairs','s:B',[-17.5,10.8,-14,12.2],'N'),('EL','Central elevator','e:E',[1,-4,3,-1],'S'),('RR','Restrooms','w',[4,-4,7,-1],'S')]
dml_zones=[([-13.5,-13,16.8,-11.5],'S','x'),([-11.3,-9.5,-1,8.7],'E','z'),([1,-9.5,16.8,-5],'W','z'),([8,-4,18.8,-1],'S','x'),([1,1,18.8,8.7],'N','x'),([-13.5,10.8,18.8,12.2],'N','x')]
dml_names={0:['Holocaust and Genocide collection','Research study','Archive support','Stacks','Reading area','Study room','Collection storage','Research office','Staff workroom','Services'],1:['Music Library','Ground-floor Rotunda','Cinematic Arts Library','Nazarian Pavilion study area','LiteraTea study area','Research study','Staff workspace','Seminar room','Collection support','Study room'],2:['Entrance Pavilion','Circulation and Bookstacks','Treasure Room','Faculty Hall','Los Angeles Times Reference Room','Hall of Honor','East Asian Library','Study room','Collection support','Staff workspace'],3:['Harman Academy for Polymathic Study','Friends Lecture Hall','Intellectual Commons','Feuchtwanger Memorial Library','Horton Rare Book Reading Room','Research office','Study room','Special Collections support','Seminar room','Staff workspace']}
dml_confirmed={0:1,1:5,2:7,3:5};floors=[]
for f in range(4):
    entries=[room(str(f*100+i+1) if f else f'B{i+1:02}',n,DML+f' pp. {f+2 if f<2 else f+2}',identity=i<dml_confirmed[f],kind='o' if i<dml_confirmed[f] and 'Room' not in n and 'Hall' not in n else 'r',notes='Tour legend digits are NOT room numbers. Assigned demo number inferred. Named service identity is historical to brochure; current tenancy unverified.') for i,n in enumerate(dml_names[f])]
    floors.append(make_floor('DML',f,dml_slabs,dml_walks,entries,distribute(entries,dml_zones),dml_cores,
        name=['Basement','Ground floor','First floor','Second floor'][f],source=DML,notes='Internal floor 1=Ground, 2=First, 3=Second. Stack mezzanines are not separately resolved. Pavilion and cafe footprints simplified.'))
    if f==1:
        floors[-1]['entrances'][0].update(at=pg([19.5,0]),label='east entrance')
        floors[-1]['entranceEvidence']['entrance']=ev(source=DML+' p. 3',identity=True,access=True,notes='Ground-floor East Entrance identity confirmed by brochure. Exact door position and step-free property inferred.')
    if f==2:
        floors[-1]['entrances'].append(dict(id='north-main',at=pg([-18,-10.5]),label='main entrance stairs',stepFree=False,entrance=True))
        floors[-1]['entranceEvidence']['north-main']=ev(source=DML+' p. 4',identity=True,access=True,notes='First-floor main entrance stairs identified by brochure. Exact landing and door position inferred; no verified accessible or evacuation claim.')
building('DML','Doheny Memorial Library',['Doheny','East Asian Library'],'confirmed','Tour names Basement, Ground, First, Second; stack mezzanines unresolved.',DML+' | Broad wings and west recess retained from campus polygon. All room positions inferred; PDF image pixels unavailable for tracing.',floors,-27.5)

# LVL: long east/west reading plate, projecting stair and south entrance pavilion.
lvl_cores=[('SA','West stairs','s:A',[-17.5,-6.5,-15,-2],'S'),('SB','North stairs','s:B',[-4.8,-9.5,-1.7,-7.2],'S'),('EL','Elevator','e:E',[-1,-6.5,1,-2],'S'),('RR','Restrooms','w',[1.5,-6.5,4,-2],'S')]
lvl_zones=[([-14.5,-6.5,-5.5,-2],'S','x'),([4.5,-6.5,18.5,-2],'S','x'),([-17.5,1,-1,4.5],'N','x'),([0,1,18.5,4.5],'N','x')]
floors=[]
for f in range(5):
    slabs=[[-18,-7,19,5],[-5,-10,-1.5,-7],[2,5,19,6]]
    walks=[[[-18,-.5],[19,-.5]],[[-3,-.5],[-3,-7]],[[0,-.5],[0,0]]]
    if f==1:slabs.append([-16,5,-8.5,12]);walks.append([[-12,-.5],[-12,5],[-12,12]])
    if f==0:
        entries=known([('13',36),('16',48),('17',74),('3B',19),('3C',20),('3V',19),('3Y',19)])
        entries += [room('B01','Ahmanson Information Commons',LVL+' p. 6',identity=True,kind='o'),room('B02','Book collection',LVL+' p. 6',identity=True,kind='o'),room('B03','Collaborative study',LVL+' p. 6',identity=True,kind='o')]
    else:
        names={1:['Circulation Desk','Weingart Reading Room','Wall of Scholars study area','Monitor study room','Periodicals and assistive technology lab','Library instruction room','Collaborative workroom','Study room','Study room','Library support'],2:['McNaughton collection','Student study space']+['Group study room']*8,3:['Ahmanson Lab','Individual study space']+['Collaborative workroom']*8,4:['Shoah Foundation suite','Research workspace','Interview workroom','Archive support','Office','Office','Office','Meeting room','Staff workspace','Research study']}[f]
        entries=[room(str(f*100+i+1),n,LVL+f' p. {f+1}',identity=(i<5 if f==1 else i<2 if f<4 else i==0),kind='o' if 'space' in n or 'collection' in n or 'Reading' in n else 'r',notes='Room number inferred, retaining demo IDs where available. Brochure service names are historical, not a current tenancy claim.') for i,n in enumerate(names)]
    if f==0:
        for r in entries[:7]:r['notes']='Room number/type/capacity confirmed by indexed Room Finder. Basement assignment inferred by matching the seven teaching rooms in the tour; position inferred.'
    # Pavilion path occupies a reserved gap in the south-west reading band on floor 1.
    zones=lvl_zones if f!=1 else [lvl_zones[0],lvl_zones[1],([-17.5,1,-13,4.5],'N','x'),([-11,1,-1,4.5],'N','x'),lvl_zones[3],([-15.5,6,-13,11.5],'E','z'),([-11,6,-9,11.5],'W','z')]
    floors.append(make_floor('LVL',f,slabs,walks,entries,distribute(entries,zones),lvl_cores,source=LVL,notes='Lower-level seven classrooms/auditorium preserved by identity; precise assignments to plan blocks inferred. Fourth-floor subdividing partitions inferred.'))
    if f==1:
        floors[-1]['entrances'][0].update(at=pg([-12,12]),label='entrance pavilion')
        floors[-1]['entranceEvidence']['entrance']=ev(source=LVL+' p. 2',identity=True,access=True,notes='Entrance Pavilion identity confirmed by brochure. Exact door position and step-free property inferred.')
building('LVL','Leavey Library',['Thomas and Dorothy Leavey Library'],'confirmed','2023 tour explicitly covers lower level and floors 1–4.',LVL+' | Long reading plate, north projection and first-floor south pavilion from campus polygon. No numeric tour key is treated as a room number. Plan image pixels were unavailable.',floors,-28.1)

# THH: narrow spine with substantial end wings, never a stretched rectangle.
thh_slabs=[[-10.5,-25,-2.5,18],[-2.5,-29.5,6,-16.5],[-7,7.5,6.8,27.5]]
thh_walks=[[[-6.5,-25],[-6.5,12],[0,12],[0,27.5]],[[-6.5,-21],[1.5,-21]],[[1.5,-22],[1.5,-21]]]
thh_cores=[('SA','Spine stairs','s:A',[-10,-24,-7.5,-21],'E'),('SB','South stairs','s:B',[-6.5,23,-1,27],'E'),('EL','Spine elevator','e:E',[-5.5,-8,-3,-5],'W'),('RR','Restrooms','w',[-5.5,-4,-3,-1],'W')]
thh_zones=[([-10,-20,-7.5,11],'E','z'),([-5.5,-15.5,-3,-9],'W','z'),([-5.5,0,-3,7],'W','z'),([-2,-29,5.5,-22],'S','x'),([-2,-20,5.5,-17],'N','x'),([-6.5,13,-1,22],'E','z'),([1,13,6.3,27],'W','z'),([1,8,6.3,11],'S','x')]
thh_known={0:[('B09',27),('B10',25)],1:[('101',319),('102',130),('105',14),('106',36),('107',14),('108',32),('109',14),('110',32),('111',14),('112',32),('113',20),('114',60),('115',20),('116',60),('117',20),('118',40),('119',38),('121',25)],2:[('201',294),('202',159),('203',20),('205',20),('207',20),('208',72),('209',20),('210',72),('211',20),('212',72),('213',30),('214',36),('215',32),('217',28),('219',12),('221',10)],3:[('301',173)]}
floors=[]
for f in range(5):
    entries=known(thh_known.get(f,[]))
    if f==3:entries += [room('309K','AIRE Conference Room','https://dornsife.usc.edu/aire/roomreservations/',40,True),room('309H','AIRE Conference Room','https://dornsife.usc.edu/aire/roomreservations/',10,True)]
    entries += legacy(f,'Faculty office' if f>=3 else 'Seminar room',entries)
    # Put large confirmed auditoria in the deep end wings, not the narrow spine.
    auditoria=[r for r in entries if r.get('capacity',0) and r['capacity']>=100]
    other=[r for r in entries if r not in auditoria]
    hall_zones=[([1,13,6.3,27],'W','z'),([-2,-29,5.5,-22],'S','x')][:len(auditoria)]
    remaining=[z for z in thh_zones if z not in hall_zones]
    entries=auditoria+other
    zones=[(*z,1) for z in hall_zones]+distribute(other,remaining)
    floors.append(make_floor('THH',f,thh_slabs,thh_walks,entries,zones,thh_cores,source=RF,notes='Basement and floors 1–3 supported by room codes. Floor 4 retained from supplied demo; count/outline at upper levels inferred. Lecture hall sizes are schematic.'))
building('THH','Taper Hall of Humanities',['Taper Hall','Mark Taper Hall'],'inferred','Basement and floors 1–3 evidenced by room records; fourth floor retained as inferred from campus.ts.',MAP+' | North/south end wings and narrow spine reconstructed from polygon; small ledges suppressed.',floors)

# VKC/DMC: three occupied stories plus basement around an EMPTY courtyard.
vkc_slabs=[[-21,-13.5,21,-7],[-21,-7,-13,13.5],[13,-7,21,13.5]]
vkc_walks=[[[-21,-10],[21,-10]],[[-17,-10],[-17,13.5]],[[17,-10],[17,13.5]]]
vkc_cores=[('SA','West stairs','s:A',[-20.5,-13,-18,-11],'S'),('SB','East stairs','s:B',[18,-13,20.5,-11],'S'),('EL','Central elevator','e:E',[-2,-13,0,-11],'S'),('RR','Restrooms','w',[1,-13,4,-11],'S')]
vkc_zones=[([-16,-13,-3,-11],'S','x'),([5,-13,16,-11],'S','x'),([-12,-9,12,-7.5],'N','x'),([-20.5,-6,-18,13],'E','z'),([-16,-6,-13.5,13],'W','z'),([13.5,-6,16,13],'E','z'),([18,-6,20.5,13],'W','z')]
vkc_known={1:list(zip(['100','101','102','103','104','105','106','107','108','109','110','111','150','151','152','153','154','155','156','157','158','160','161'],[58,40,50,12,16,24,24,22,22,26,21,24,56,36,48,12,32,32,60,36,32,25,25])),2:list(zip(['200','201','202','203','204','205','206','207','208','209','210','211','252','254','255','256','257','258','259','260','261'],[30,37,20,37,18,36,26,36,19,26,35,36,36,20,20,36,28,36,21,37,37]))}
floors=[]
for f in range(4):
    entries=known(vkc_known.get(f,[]))
    for r in entries:r['notes']+=' Published under current alias DMC; stable VKC ID retained.'
    entries+=legacy(f,'Library study area' if f==0 else 'Faculty office' if f==3 else 'Classroom',entries)
    if f==0:entries[0]=room('B01','Library for International and Public Affairs',VKC,identity=True,kind='o',notes='Number inferred; lower-level library existence confirmed. Legacy generic floor 0 did not exist.')
    void=dict(id=f'VKC-{f}-COURT',name='Sunken courtyard / open air above courtyard',rect=[-13,-7,13,13.5],evidence=ev(source=VKC,identity=True,notes='Courtyard existence confirmed; boundary inferred. No interior slab, room, or route crosses it.'))
    floors.append(make_floor('VKC',f,vkc_slabs,vkc_walks,entries,distribute(entries,vkc_zones),vkc_cores,source=VKC,voids=[void],notes='U-shaped wings retained; campus DMC path is only an outer envelope. Nonoccupied globe tower not modeled as an occupied floor. Old inferred fourth-floor rooms removed.'))
building('VKC','Dr. Joseph Medicine Crow Center for International and Public Affairs',['DMC','VKC','Von KleinSmid Center','Medicine Crow'],'confirmed','City historic report describes three stories over basement; supersedes original generic four stories.',VKC+' | U-shaped occupied wings within campus DMC envelope. Courtyard proportions and wing widths inferred, tower excluded.',floors,-27.9)

# TCC: slender bent bar, north head and wider southern base. SKS is NOT TCC.
tcc_slabs=[[-5.2,-21.8,3.5,21],[-3.8,-21.8,6,-14],[-7.3,9,3.5,18]]
tcc_walks=[[[0,-21.8],[0,21]]]
tcc_cores=[('SA','North stairs','s:A',[-4.8,-21.3,-1,-18.5],'E'),('SB','South stairs','s:B',[-4.8,18,-1,20.5],'E'),('EL','Central elevator','e:E',[-4.8,-2,-1,1],'E'),('RR','Restrooms','w',[-4.8,1.5,-1,4.5],'E')]
tcc_zones=[([-4.8,-18,-1,-2.5],'E','z'),([-4.8,5,-1,8.5],'E','z'),([-6.8,9.5,-1,17.5],'E','z'),([1,-21.3,5.5,-14.5],'W','z'),([1,-13.5,3,20.5],'W','z')]
tcc_known={2:[('221','Meeting room'),('224','First Generation Plus Success Center'),('227','Rosen Family Screening Room'),('232','Meeting room')],3:[('315','Lactation Room'),('320A','MAAA Cruz Family Board Room'),('320B','Meeting room'),('320C','Hui Conference Room'),('322','Asian Pacific Alumni Association'),('323','Black Alumni Association'),('324','Latino Alumni Association'),('330','Fraternity & Sorority Leadership Development / Veterans Resource Center'),('350','Franklin Suite 350'),('351','Franklin Suite 351'),('352','Franklin Suite 352')],4:[('421','Campus Wellbeing & Crisis Intervention'),('425','Trojan Event Services'),('432','Gupta Meeting Room'),('433','Meeting room'),('434','Meeting room'),('450','The Forum')]}
floors=[]
for f in range(1,5):
    entries=[room(n,title,TCC if n in ['224','315','322','323','324','330','421','425'] else MEET,confirmed=True,notes='Room number/name confirmed by directory. '+('Directory lists two occupants for 330; one room retained, tenancy unresolved.' if n=='330' else 'Franklin suite subdivisions inferred.' if n in ['350','351','352'] else '')) for n,title in tcc_known.get(f,[])]
    entries+=legacy(f,'Dining / student commons' if f==1 else 'Office / meeting room',entries)
    if f==4:
        forum=next(r for r in entries if r['number']=='450')
        other=[r for r in entries if r is not forum]
        entries=[forum]+other
        zones=[(*tcc_zones[2],1)]+distribute(other,[z for z in tcc_zones if z!=tcc_zones[2]])
    else: zones=distribute(entries,tcc_zones)
    floors.append(make_floor('TCC',f,tcc_slabs,tcc_walks,entries,zones,tcc_cores,source=[TCC,MEET],notes='SKS B3/B4/B5/B41/B42, SKS 100/107/202/305/410 excluded. No TCC basement asserted. Room-number prefix sets floor; all boundaries inferred. Forum receives a larger inferred event-room volume.'))
building('TCC','Ronald Tutor Campus Center',['Tutor Campus Center'],'confirmed','Directory and meeting-room list support floors 1–4; basement entries belong to SKS.',MAP+' | Narrow north/south bar and wider end volumes follow supplied TCC polygon, not the old rectangle.',floors,-27.6)

# SGM: larger irregular podium with connector and south wing; upper tower setback inferred.
sgm_tower=[[-12,-21,13,0]]
sgm_podium=sgm_tower+[[-6.5,0,5.5,10.5],[-13,10.5,12,20.5],[-12,0,-6.5,6]]
sgm_cores=[('SA','West stairs','s:A',[-11.5,-9,-8.5,-6],'N'),('SB','East stairs','s:B',[9,-9,12.5,-6],'N'),('EL','Elevator bank','e:E',[1,-9,3,-6],'N'),('RR','Restrooms','w',[-4,-9,-1,-6],'N')]
sgm_zones=[([-11.5,-20.5,-1,-11],'E','z'),([1,-20.5,12.5,-11],'W','z'),([-11.5,-5,-1,-.5],'E','z'),([1,-5,12.5,-.5],'W','z')]
floors=[]
for f in range(1,11):
    walks=[[[0,-21],[0,-10],[0,0]],[[-12,-10],[13,-10]]]
    zones=sgm_zones.copy()
    if f<=2:
        walks[0] += [[0,16]]
        walks += [[[-13,16],[0,16],[12,16]]]
        zones += [([-6,1,-1,10],'E','z'),([1,1,5,10],'W','z'),([-12.5,11,-1,15],'S','x'),([1,11,11.5,15],'S','x'),([-12.5,17,11.5,20],'N','x')]
    entries=known({1:[('101',163),('123',331),('124',244)],2:[('226',32)],6:[('601',49)]}.get(f,[]))
    entries+=legacy(f,'Research lab' if f<10 else 'Clinic / consultation room',entries)
    if f==10:entries[0]=room('1001','Psychology Services Center',SGM,identity=True,notes='10th-floor clinic confirmed. Number 1001 and clinic subdivision inferred; no claim of public/unrestricted access.')
    if f==1:
        # The third auditorium occupies the deep southern hall volume.
        walks[0][-1]=[0,11.5]
        walks[-1]=[[-13,11.5],[0,11.5],[12,11.5]]
        hall_zones=[sgm_zones[0],sgm_zones[1],([-12.5,12.5,11.5,20],'N','x')]
        zones_out=[(*z,1) for z in hall_zones]+distribute(entries[3:],zones[2:6])
    else: zones_out=distribute(entries,zones)
    floor=make_floor('SGM',f,sgm_podium if f<=2 else sgm_tower,walks,entries,zones_out,sgm_cores,source=SGM,notes='Ten occupied levels implemented because USC identifies clinic on 10th floor. Tower/podium split at floor 3 inferred; highest occupied level, basement and mechanical levels unresolved.')
    if f==1:floor['entrances'][1]['at']=pg([12,11.5])
    floors.append(floor)
building('SGM','Seeley G. Mudd Building',['Seeley G. Mudd','SGM'],'inferred','At least 10 floors evidenced by clinic directions. Exactly 10 modeled; total floor count not verified.',MAP+' | Irregular ground podium, narrow connector and southern wing retained. North tower setback at floor 3 is inferred.',floors,-27.8)

# SAL: tall southern block and one-story northern auditorium/lobby volume.
sal_south=[[-11.5,-2,12,7],[-7,7,8,8.5]]
sal_cores=[('SA','West stairs','s:A',[-11,-1.5,-8,1],'S'),('SB','East stairs','s:B',[8,-1.5,11.5,1],'S'),('EL','Elevator','e:E',[-6,-1.5,-4,1],'S'),('RR','Restrooms','w',[-3,-1.5,-1,1],'S')]
sal_zones=[([1,-1.5,7.5,1],'S','x'),([-11,3,11.5,6.5],'N','x')]
floors=[]
for f in range(4):
    slabs=sal_south.copy();walks=[[[-11.5,2],[12,2]]];zones=sal_zones.copy()
    entries=known([('101',263)]) if f==1 else []
    entries+=legacy(f,'Computer laboratory' if f<2 else 'Research office',entries)
    if f<2:
        slabs += [[-9.5,-8.5,10.5,-2]]
        walks += [[[0,2],[0,-2.5]]]
        # Auditorium has a wide north volume; no corridor crosses its interior.
        big=entries[:1];rest=entries[1:]
        entries=big+rest
        z=[([-9,-8,10,-3],'S','x',1)]+distribute(rest,zones)
    else:z=distribute(entries,zones)
    floors.append(make_floor('SAL',f,slabs,walks,entries,z,sal_cores,source=SAL,notes='Three-story southern block plus one-story northern volume and basement supported by historic description. Auditorium placement in north block inferred.'))
building('SAL','Salvatori Computer Science Center',['Henry Salvatori Computer Science Center'],'confirmed','Historic resource description: three stories over basement; north volume one story.',SAL+' | Campus polygon simplified to southern block with corner/tongue projection and lower north volume; no GFS records imported.',floors)

# KAP: long north/south slab with stepped end caps and three central elevators.
kap_slabs=[[-9.2,-17,8.3,14],[-6.2,-20,2.5,-17],[-4.8,14,3,20]]
kap_walks=[[[0,-20],[0,0],[0,20]],[[-9.2,0],[8.3,0]]]
kap_cores=[('SA','North stairs','s:A',[-5.8,-19.5,-1,-17.5],'E'),('SB','South stairs','s:B',[-4.3,16,-1,19.5],'E'),('EL','Elevator 1','e:E',[-7,-2,-5,-.6],'S'),('EL2','Elevator 2','e:E2',[-5,-2,-3,-.6],'S'),('EL3','Elevator 3','e:E3',[-3,-2,-1,-.6],'S'),('RR','Restrooms','w',[1,-3,4,-1],'S')]
kap_zones=[([-8.7,-16.5,-1,-3],'E','z'),([-8.7,1,-1,13.5],'E','z'),([1,-13.5,7.8,-4],'W','z'),([1,1,7.8,13.5],'W','z')]
kap_rooms=list(zip(['113','134','137','138','140','141','144','145','146','147','148','150','156','158','159','163','164','165','166','167'],[25,24,24,24,31,24,48,36,48,35,35,12,48,40,25,40,25,25,28,25]))
floors=[]
for f in range(5):
    entries=known(kap_rooms) if f==1 else []
    entries+=legacy(f,'Laboratory' if f==0 else 'Classroom' if f==1 else 'Research office',entries)
    floors.append(make_floor('KAP',f,kap_slabs,kap_walks,entries,distribute(entries,kap_zones),kap_cores,source=KAP+' p. 3',notes='Four stories and basement, classrooms on first, offices above, labs below, three central elevators supported by 2013 structural report. Individual core boxes and partitions inferred.'))
building('KAP','Kaprielian Hall',['Kaprielian'],'confirmed','2013 USC report explicitly describes four stories and laboratory basement.',KAP+' | Long north/south footprint and stepped end caps based on campus polygon. Structural figure pixels unavailable; detailed partition geometry inferred.',floors,-.3)

for code,spec in all_specs.items():
    # No fabricated claims of confirmed position, even for evidence-backed names.
    content="// Generated by scripts/build-interior-specs.py; all coordinates are inferred.\nimport type { Reconstruction } from './types.js'\n\n"
    content+=f'export const {code}_RECONSTRUCTION: Reconstruction = '+re.sub(r'(?m)^(\s*)null(,?)$',r'\1undefined\2',json.dumps(spec,ensure_ascii=False,indent=2))+'\n'
    (OUT/f'{code.lower()}.ts').write_text(content, encoding='utf-8')
index="import type { Reconstruction } from './types.js'\n"
index+=''.join(f"import {{ {c}_RECONSTRUCTION }} from './{c.lower()}.js'\n" for c in all_specs)
index+="\nexport const INTERIORS: Record<string, Reconstruction> = {\n"+''.join(f'  {c}: {c}_RECONSTRUCTION,\n' for c in all_specs)+"}\n"
(OUT/'index.ts').write_text(index, encoding='utf-8')
print('Authored',len(all_specs),'buildings,',sum(len(s['floors']) for s in all_specs.values()),'floors')
