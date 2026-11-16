#!/usr/bin/env python3
"""Rebuild the campus's roads and green polygons from an OSM API XML extract.

Usage: python3 scripts/extract-campus-geography.py path/to/campus.osm
Existing boundary rings, hand-positioned road labels, and illustrative hedges
are preserved. Standard library only; no network calls or imagery tracing.
"""
import json
import math
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'demos/usc-map/campus-geography.json'
geo = json.loads(TARGET.read_text())
xml = ET.parse(sys.argv[1]).getroot()
nodes = {n.get('id'): [float(n.get('lat')), float(n.get('lon'))] for n in xml.findall('node')}
areas = [a['ring'] for a in geo['areas']]


def inside(point, ring):
    y, x = point
    result = False
    for (y1, x1), (y2, x2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > y) != (y2 > y) and x < (x2-x1) * (y-y1)/(y2-y1) + x1:
            result = not result
    return result


def intersects(a, b, c, d):
    def side(p, q, r):
        return (q[0]-p[0]) * (r[1]-p[1]) - (q[1]-p[1]) * (r[0]-p[0])
    return (max(a[0], b[0]) >= min(c[0], d[0]) and max(c[0], d[0]) >= min(a[0], b[0])
            and max(a[1], b[1]) >= min(c[1], d[1]) and max(c[1], d[1]) >= min(a[1], b[1])
            and side(a,b,c)*side(a,b,d) <= 0 and side(c,d,a)*side(c,d,b) <= 0)


def touches_area(points):
    if any(inside(p, ring) for p in points for ring in areas):
        return True
    return any(intersects(a,b,c,d) for a,b in zip(points, points[1:])
               for ring in areas for c,d in zip(ring, ring[1:] + ring[:1]))


def boundary_distance(point):
    # Local planar distance is sufficient for a <2km styling crop.
    py, px = point[0] * 111320, point[1] * 92250
    best = math.inf
    for ring in areas:
        for a,b in zip(ring,ring[1:] + ring[:1]):
            ay,ax,by,bx = a[0]*111320,a[1]*92250,b[0]*111320,b[1]*92250
            dy,dx = by-ay,bx-ax
            t = max(0,min(1,((py-ay)*dy + (px-ax)*dx)/(dy*dy+dx*dx or 1)))
            best = min(best, math.hypot(py-ay-t*dy,px-ax-t*dx))
    return best


all_points = [p for ring in areas for p in ring]
# Keep border-street widths and the Village's north/west curb edges visible.
lat_min = min(p[0] for p in all_points) - 0.00022
lat_max = max(p[0] for p in all_points) + 0.00022
lng_min = min(p[1] for p in all_points) - 0.00027
lng_max = max(p[1] for p in all_points) + 0.00027


def clip_segment(a, b):
    # Liang-Barsky clipping, returning endpoints within the campus frame.
    lo, hi = 0.0, 1.0
    dy, dx = b[0]-a[0], b[1]-a[1]
    for p,q in [(-dy,a[0]-lat_min),(dy,lat_max-a[0]),(-dx,a[1]-lng_min),(dx,lng_max-a[1])]:
        if not p:
            if q < 0: return None
            continue
        t=q/p
        if p < 0: lo=max(lo,t)
        else: hi=min(hi,t)
        if lo > hi: return None
    return [[round(a[0]+t*dy,7),round(a[1]+t*dx,7)] for t in [lo,hi]]


def clip_line(points):
    result, current = [], []
    for a,b in zip(points,points[1:]):
        segment = clip_segment(a,b)
        if segment:
            if current and current[-1] != segment[0]:
                result.append(current); current=[]
            if not current: current.append(segment[0])
            if segment[1] != current[-1]: current.append(segment[1])
        elif current:
            result.append(current); current=[]
    if current: result.append(current)
    return [line for line in result if len(line)>1]


walks = {'footway','path','pedestrian','steps','cycleway'}
streets = {'primary','secondary','tertiary','residential','service','unclassified','living_street',
           'primary_link','secondary_link','tertiary_link'}
perimeter = {'West 30th Street','McClintock Avenue','West Jefferson Boulevard','South Hoover Street'}
roads, greens = [], []
for way in xml.findall('way'):
    tags = {t.get('k'): t.get('v') for t in way.findall('tag')}
    points = [nodes[n.get('ref')] for n in way.findall('nd') if n.get('ref') in nodes]
    if len(points) < 2: continue
    kind = tags.get('highway')
    if kind in walks | streets:
        touching = touches_area(points)
        border = kind in streets and (tags.get('name') in perimeter or
            any(boundary_distance(p) <= 28 for p in points))
        if touching or border:
            for i,line in enumerate(clip_line(points)):
                # Footways from neighboring blocks are cut by the campus clip in the renderer.
                roads.append({'id':way.get('id') + (f'-{i}' if i else ''),
                              'name':tags.get('name',''), 'kind':kind, 'points':line})
    green = (tags.get('landuse') in {'grass','recreation_ground'} or
             tags.get('landcover') == 'grass' or tags.get('leisure') in {'park','garden'} or
             (tags.get('leisure') == 'pitch' and tags.get('sport') not in {'tennis','basketball','beachvolleyball'}
              and tags.get('surface') not in {'sand','asphalt','concrete'}))
    if green and len(points) >= 4 and points[0] == points[-1] and touches_area(points):
        kind = 'field' if tags.get('leisure') == 'pitch' or tags.get('landuse') == 'recreation_ground' else 'lawn'
        greens.append({'id':way.get('id'),'name':tags.get('name',''), 'kind':kind, 'ring':points})

geo['roads'] = roads
geo['greens'] = greens
geo['landscapingNote'] = ('Fields, parks, and lawn polygons use OpenStreetMap geometry. Green park fills are '
    'a simplified landscape treatment, not a surveyed grass-only inventory. Hedge accents along Trousdale '
    'Parkway are illustrative. No satellite imagery is bundled or traced.')
geo['extractionNote'] = ('All mapped footways, paths, steps, pedestrian and cycle routes intersecting the two '
    'campus areas are retained, including unnamed ways. Boundary streets and the Village border streets '
    'are retained within the campus frame. Footway display should be clipped to the campus areas.')
TARGET.write_text(json.dumps(geo,separators=(',',':'))+'\n')
print(f'{len(roads)} road/path segments; {sum(r["kind"] in walks for r in roads)} walk/cycle segments; {len(greens)} green polygons; {len(geo["hedges"])} illustrative hedge strokes')
