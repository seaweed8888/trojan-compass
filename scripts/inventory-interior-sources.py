#!/usr/bin/env python3
"""Index the supplied tracker and download manifest without running downloads."""
import ast
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/interiors'
INPUT = OUT / 'inputs'
FLOORS = {'DML':'B; Ground; First; Second','LVL':'B; 1; 2; 3; 4','THH':'B; 1; 2; 3; 4 (inferred)',
          'VKC':'B; 1; 2; 3','TCC':'1; 2; 3; 4','SGM':'1–10 (total inferred)','SAL':'B; 1; 2; 3','KAP':'B; 1; 2; 3; 4','LAW':'0–4; unchanged'}
rows = []
columns = ['Inventory ID','Input record','Provided building code(s)','Resolved building code(s)','Floor coverage','Material','Source file or URL','Review status','Facts used / limits / alias decision']
def add(id,record,provided,codes,coverage,material,source,status,notes):
    rows.append([id,record,provided,codes,coverage,material,source,status,notes])

for line,row in enumerate(csv.DictReader((INPUT/'buildings.csv').open(encoding='utf-8-sig')),2):
    given=row['Code']; code='VKC' if given=='DMC' else given
    relevant=code in FLOORS
    note='Building identity and document leads only; no room geometry, numbers or floor counts in this tracker.'
    if given=='DMC':note+=' Current DMC alias maps to existing VKC keys; supplied John/Public-and-International wording differs from USC naming; use Dr. Joseph Medicine Crow Center for International and Public Affairs.'
    if given=='TCC':note+=' Ballroom and basement event leads refer to adjoining SKS; do not merge footprints.'
    add(f'CSV-{line}',f'Buildings!A{line}:G{line}',given,code,FLOORS.get(code,'Outside supported interiors'),
        row['Building name']+'; '+row['Floor-plan documents (links)'],'docs/interiors/inputs/buildings.csv',
        'Identity used; LAW retained' if code=='LAW' else 'Identity used' if relevant else 'Outside scope',note)

tree=ast.parse((INPUT/'download_usc_floorplan_docs.py').read_text())
assignment=next(n for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='ITEMS' for t in n.targets))
items=json.loads(assignment.value.args[0].value)
review={
 1:('LVL','B; 1; 2; 3; 4','Text reviewed; plan pixels unavailable','Floor count, named services and seven lower-level teaching rooms retained. Legend numbers are not room numbers.'),
 2:('DML','B; Ground; First; Second','Text reviewed; plan pixels unavailable','Named areas, ground-floor east entrance and first-floor main entrance stairs retained. Legend numbers not room numbers. Stack mezzanines unresolved.'),
 3:('DML','First','Text reviewed; linked images unavailable','Confirms East Asian Library Reading Room on First floor, internal index 2.'),
 12:('TCC; SKS','TCC 1–4; SKS B and above','Reviewed','Confirmed TCC office numbers retained. TCC 330 has two listed occupants; one room, combined name. SKS B3/B4/B5/B41/B42 and 100/107/202/305/410 excluded.'),
 13:('TCC','2; 3; 4','Reviewed','Meeting room numbers/names retained; divisions and exact positions inferred.'),
 14:('VKC (DMC); KAP; LVL; SAL; SGM; THH','Room prefixes; LVL basement assignment inferred','Indexed primary-source table reviewed; live site unavailable','Confirmed room codes and capacities retained. Geometry not supplied. Published DMC codes resolve to VKC. Availability and current tenancy unverified.'),
 15:('THH','2','Indexed primary-source table reviewed','THH 202 number/capacity retained; photo/diagram pixels not traced.'),
 16:('LVL','Unresolved','Unavailable','Booking system could not be read; no booking-room numbers invented as confirmed.'),
 19:('All supported buildings','Identity only','Reference lead; not imported','Tracker and campus JSON sufficient for stable building identities; schedule directory adds no imported floor geometry.'),
 20:('SKS','Basement','Alias corrected; excluded','Grand Ballroom belongs to Sample Hall in combined directory; supplied TCC tag not used as TCC interior geometry.'),
 21:('SKS','Basement','Alias corrected; excluded','Grand Ballroom subdivisions are SKS, not TCC.'),
 22:('SKS','Basement','Alias corrected; excluded','Grand Ballroom subdivisions are SKS, not TCC.'),
 23:('SKS','Basement','Alias corrected; excluded','Grand Ballroom volume is SKS, not TCC.'),
 24:('SKS','Basement B4','Alias corrected; excluded','Tommy’s Place listed as SKS B4 in combined directory.'),
 25:('SKS','Basement B5','Alias corrected; excluded','Traditions listed as SKS B5 in combined directory.'),
 96:('DML','First','Image fetch failed','Reading-room image unavailable; no traced room boundaries claimed.'),
 97:('DML','Stack levels unresolved','Image fetch failed','Stack image unavailable; no stack/mezzanine geometry claimed.'),
}
for i,item in enumerate(items,1):
    codes='; '.join('VKC' if c=='DMC' else c for c in item['buildings'].split() if c in {*FLOORS,'DMC'})
    if i in review:code,coverage,status,note=review[i]
    elif codes=='LAW':code,coverage,status,note='LAW',FLOORS['LAW'],'Excluded from reconstruction','LAW traced source retained byte-for-byte.'
    else:
        broad=bool(re.search(r'all |every |UPC|campus|older|buildings',item['buildings']))
        code,coverage,status,note=(item['buildings'],'Unresolved','Reference lead; not imported' if broad else 'Outside scope',
                                 'Manifest lead only; source not used as confirmed interior evidence. No additional supported building introduced.')
    if item['manual']:note+=' Supplied access note: '+item['manual']
    add(f'PY-{i}',f'ITEMS[{i-1}]',item['buildings'],code,coverage,item['name'],item['url'],status,note)

for code in FLOORS:
    add(f'REPO-{code}','Campus polygon; original floor metadata','DMC' if code=='VKC' else code,code,FLOORS[code],
        'Saved footprint and original template','demos/usc-map/locations.json; server/src/infrastructure/datasets/prototype/campus.ts; original floorplan.ts',
        'Reviewed; LAW unchanged' if code=='LAW' else 'Used as shape/identity evidence; simplified geometry inferred',
        'DMC envelope supplemented with U-shaped courtyard from historic report.' if code=='VKC' else 'Polygon proportions/orientation used; small ledges simplified. Existing generic demo numbers preserved where compatible; not promoted to confirmed.')

supplemental=[
 ('KAP','B; 1–4','USC structural report 2013','https://bpb-us-w1.wpmucdn.com/sites.usc.edu/dist/f/100/files/2018/02/r2_CE_13_01_Ebrahimian_and_Trifunac_KAP_Vib_tests-vmv6a6.pdf','Four stories plus laboratory basement, first-floor classrooms, offices above, three central elevators. Detailed figure pixels unavailable.'),
 ('SGM','10; total unresolved','USC Psychology Services Center directions','https://dornsife.usc.edu/usc-psc/client-hub/directions-to-sgm/','Clinic on tenth floor supports at least ten occupied floors. Exactly ten and podium/tower split are inferred.'),
 ('SAL','B; 1–3','City of Los Angeles supplemental historic resources report','https://planning.lacity.gov/eir/USC/FEIR/files/USC%20Appendix%20C-1%20Supplemental%20Historic%20Resources%20Report.pdf','Three-story southern block over basement, one-story northern volume. Auditorium position inferred.'),
 ('VKC','B; 1–3','City historic monument report','https://cityclerk.lacity.org/onlinedocs/2013/13-1464-s8_rpt_chc_10-28-2013.pdf','Three stories over basement, U-shaped wings, sunken courtyard and lower-level library; nonoccupied tower excluded.'),
 ('VKC','Identity only','USC renaming announcement','https://today.usc.edu/joseph-medicine-crow-building/','Current name/alias DMC; retain VKC keys and original links.'),
 ('THH','3','USC AIRE room reservations','https://dornsife.usc.edu/aire/roomreservations/','309H and 309K meeting rooms; capacities 10 and 40. Positions inferred.'),
]
for i,(code,coverage,title,url,note) in enumerate(supplemental,1):
    add(f'PUBLIC-{i}','Public supplement, reviewed 2026-11-14/15',code,code,coverage,title,url,'Primary-source text or indexed primary-source excerpt reviewed',note)

with (OUT/'source-inventory.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.writer(f);writer.writerow(columns);writer.writerows(rows)
print(f'{len(rows)} source inventory rows ({len(items)} supplied manifest entries)')
