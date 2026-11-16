#!/usr/bin/env python3
"""Extract real street centerlines from one or more official OSM XML map tiles.

Usage: python3 scripts/extract-surrounding-roads.py path/to/surrounding-*.osm
Standard library only. No imagery, buildings, POIs, or satellite tracing.
"""
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BOUNDS = {'south': 34.005, 'north': 34.041, 'west': -118.305, 'east': -118.270}
nodes, ways = {}, {}
for file in sys.argv[1:]:
    xml = ET.parse(file).getroot()
    for node in xml.findall('node'):
        nodes[node.get('id')] = [float(node.get('lat')), float(node.get('lon'))]
    for way in xml.findall('way'):
        ways[way.get('id')] = way


def clip_segment(a, b):
    lo, hi = 0.0, 1.0
    dy, dx = b[0] - a[0], b[1] - a[1]
    for p, q in [(-dy, a[0]-BOUNDS['south']), (dy, BOUNDS['north']-a[0]),
                 (-dx, a[1]-BOUNDS['west']), (dx, BOUNDS['east']-a[1])]:
        if not p:
            if q < 0:
                return None
            continue
        t = q / p
        if p < 0:
            lo = max(lo, t)
        else:
            hi = min(hi, t)
        if lo > hi:
            return None
    return [[round(a[0]+t*dy, 7), round(a[1]+t*dx, 7)] for t in [lo, hi]]


def clip_line(points):
    result, current = [], []
    for a, b in zip(points, points[1:]):
        segment = clip_segment(a, b)
        if segment:
            if current and current[-1] != segment[0]:
                result.append(current)
                current = []
            if not current:
                current.append(segment[0])
            if segment[1] != current[-1]:
                current.append(segment[1])
        elif current:
            result.append(current)
            current = []
    if current:
        result.append(current)
    return [line for line in result if len(line) > 1]


kinds = {'motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'residential',
         'living_street', 'unclassified', 'service', 'motorway_link', 'trunk_link',
         'primary_link', 'secondary_link', 'tertiary_link'}
roads = []
for ident, way in sorted(ways.items(), key=lambda item: int(item[0])):
    tags = {tag.get('k'): tag.get('v') for tag in way.findall('tag')}
    kind = tags.get('highway')
    if kind not in kinds or tags.get('area') == 'yes':
        continue
    if kind == 'service' and tags.get('service') in {'parking_aisle', 'driveway', 'drive-through'}:
        continue
    refs = [nd.get('ref') for nd in way.findall('nd')]
    if not all(ref in nodes for ref in refs):
        raise ValueError(f'Incomplete node references for way {ident}')
    for index, line in enumerate(clip_line([nodes[ref] for ref in refs])):
        roads.append({'id': ident + (f'-{index}' if index else ''),
                      'name': tags.get('name', ''), 'kind': kind, 'points': line})

target = ROOT / 'demos/usc-map/surrounding-roads.json'
target.write_text(json.dumps({
    'source': 'OpenStreetMap contributors', 'license': 'ODbL 1.0',
    'sourceURL': 'https://www.openstreetmap.org/copyright',
    'downloaded': '2026-11-14', 'bounds': BOUNDS,
    'extractionNote': 'Street centerlines only; parking aisles and driveways excluded. Campus interior masked by renderer.',
    'roads': roads,
}, separators=(',', ':')) + '\n')
print(f'{len(roads)} surrounding street segments; {target.stat().st_size} bytes')
