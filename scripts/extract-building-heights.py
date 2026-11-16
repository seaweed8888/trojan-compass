#!/usr/bin/env python3
"""Derive approximate campus extrusion heights from OSM, floor counts, and fallbacks.

Usage: python3 scripts/extract-building-heights.py path/to/campus.osm
Reported OSM heights are not survey-verified. Floor-derived meters are estimates.
"""
import collections
import json
from pathlib import Path
import re
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CAMPUS = ROOT / 'demos/usc-map'
places = json.loads((CAMPUS / 'locations.json').read_text())
geo = json.loads((CAMPUS / 'campus-geography.json').read_text())
xml = ET.parse(sys.argv[1]).getroot()
nodes = {n.get('id'): [float(n.get('lat')), float(n.get('lon'))] for n in xml.findall('node')}


def inside(point, ring):
    lat, lng = point
    result = False
    for (y1, x1), (y2, x2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > lat) != (y2 > lat) and lng < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
            result = not result
    return result


def area(ring):
    # Shift the origin to retain precision for these small geographic polygons.
    lat, lng = ring[0]
    local = [(y-lat, x-lng) for y,x in ring]
    return abs(sum(a[0]*b[1]-b[0]*a[1] for a,b in zip(local,local[1:]+local[:1]))) / 2


def number(value):
    match = re.fullmatch(r'\s*(\d+(?:\.\d+)?)\s*(m|ft|feet)?\s*', value or '')
    if not match:
        return None
    n = float(match[1])
    return n * .3048 if match[2] in {'ft', 'feet'} else n


ways = []
for way in xml.findall('way'):
    tags = {t.get('k'): t.get('v') for t in way.findall('tag')}
    if not tags.get('building') or tags['building'] == 'no':
        continue
    ring = [nodes[n.get('ref')] for n in way.findall('nd') if n.get('ref') in nodes]
    if len(ring) < 4 or ring[0] != ring[-1]:
        continue
    height = number(tags.get('height'))
    levels = number(tags.get('building:levels'))
    if height is None and levels is None:
        continue
    ways.append({'id': way.get('id'), 'ring': ring, 'height': height, 'levels': levels,
                 'name': tags.get('name', '')})

buildings = {}
for place in places:
    if not place.get('paths') or not any(inside([place['lat'], place['lng']], a['ring']) for a in geo['areas']):
        continue
    rings = [place['paths']] if isinstance(place['paths'][0][0], (int, float)) else place['paths']
    vertices = [p for ring in rings for p in ring]
    footprint_area = sum(area(ring) for ring in rings)
    # Use actual polygon containment, never an indiscriminate nearest-building match.
    candidates = []
    for way in ways:
        # A tiny tower/chimney inside a large footprint must not raise the entire mass.
        if area(way['ring']) < footprint_area * .25:
            continue
        center_inside = inside([place['lat'], place['lng']], way['ring'])
        overlap = sum(inside(p, way['ring']) for p in vertices) / len(vertices)
        reverse = sum(any(inside(p, ring) for ring in rings) for p in way['ring']) / len(way['ring'])
        if center_inside or overlap >= .4 or reverse >= .65:
            candidates.append((overlap + reverse + float(center_inside), way))
    best = max(candidates, key=lambda pair: pair[0])[1] if candidates else None
    name, code = place['name'], place.get('code', '')
    entry = {'name': name, 'meters': 12, 'source': 'typology-estimate', 'estimated': True}
    # These directory footprints are grounds/stands, not full-height academic buildings.
    if re.search(r'Parking Lot|Baseball Stadium|Aquatics Center', name, re.I):
        entry.update(meters=0, source='ground-footprint')
    elif code in {'LTS', 'MTS'}:
        entry.update(meters=4, source='low-stands-estimate')
    elif best and best['height'] and 2 <= best['height'] <= 100:
        entry.update(meters=round(best['height'], 1), source='osm-height', estimated=False,
                     osmWayId=best['id'])
    elif code == 'WTO':
        entry.update(meters=46.2, source='usc-floor-count', floors=14)
    elif code in {'MHC', 'CRC', 'CIC', 'MRC', 'NBC'}:
        entry.update(meters=18, source='usc-floor-count', floors=5)
    elif best and best['levels'] and 1 <= best['levels'] <= 25:
        entry.update(meters=round(best['levels'] * 3.5, 1), source='osm-floor-count',
                     floors=best['levels'], osmWayId=best['id'])
    elif re.search(r'parking|garage', name, re.I) or place['category'] != 'Buildings':
        entry.update(meters=14)
    elif re.search(r'House|Trailer|Laboratory', name, re.I):
        entry.update(meters=6)
    buildings[str(place['id'])] = entry

result = {
    'description': 'Approximate massing heights, not a survey or an Apple Maps height export.',
    'sources': {
        'osm': {'url': 'https://www.openstreetmap.org/copyright', 'license': 'ODbL 1.0',
                'extractDate': '2026-11-14'},
        'webb': {'url': 'https://housing.usc.edu/index.php/buildings/webb-tower-residential-college/',
                 'floors': 14},
        'village': {'url': 'https://village.usc.edu/about/', 'floors': 5},
    },
    'method': 'Prefer OSM height tags matched by polygon containment; otherwise documented floors '
              'or matched OSM levels converted to approximate meters, then explicit typology defaults. '
              'Ground and low-stand directory footprints are kept flat or low.',
    'buildings': buildings,
}
(CAMPUS / 'building-heights.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
print(len(buildings), dict(collections.Counter(b['source'] for b in buildings.values())))
