# Campus vector map sources

`campus-geography.json` contains OpenStreetMap campus boundaries, street/path
geometry, and field/park/lawn polygons downloaded on 2026-11-14 from the official OSM map API
for bounding box `-118.2925,34.0175,-118.2795,34.028`.
University Park uses way 161235655; USC Village uses way 541642577.

© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
The derived geographic data is available under the
[Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
The map displays this attribution with a link to the license information.

Building footprints and directory records remain from the user-supplied USC map
in `locations.json`; they are filtered to the two campus areas. Original source
credits remain with the supplied assets. No Google tiles are rendered by the
new map. The original saved HTML remains as the host for existing controls.

Green field, lawn, and park polygons use actual OpenStreetMap geometry. Park
fills are a simplified landscape treatment; they are not a surveyed inventory
of grass alone. These include Dedeaux, Howard Jones, Allyson Felix, Brittingham,
Village Turf, Great Lawn, Parkside Field, Alumni Park, and McCarthy Quad.
Green strokes beside Trousdale Parkway remain illustrative hedge accents,
not surveyed hedge positions. Satellite views were used only as visual context;
no satellite imagery is bundled or traced.

All mapped footways, paths, steps, pedestrian routes, and cycleways intersecting
the selected campus boundaries are retained, including unnamed ways. Rendering
clips these routes to the campus areas. Border streets remain visible, including
McClintock Avenue, West Jefferson Boulevard, West 30th Street, and South Hoover
Street around USC Village. Street segments are clipped to a frame just beyond
the campus extent; surrounding buildings are excluded.

To reproduce the road and green layers from the same OSM extract, run:

```sh
python3 scripts/extract-campus-geography.py path/to/campus.osm
```

## Surrounding street context

`surrounding-roads.json` contains real OpenStreetMap street centerlines from the
same official API, downloaded on 2026-11-14 for the larger bounding box
`-118.305,34.005,-118.270,34.041`. The extent was downloaded as ten smaller
tiles to stay below the API's node limit, then merged by OSM way ID and clipped
to that bounding box. The same OpenStreetMap attribution and ODbL terms above
apply to this derived data.

Only streets are included in the context layer. Buildings, POIs, labels,
parking aisles, and driveways are excluded. The renderer masks the campus
interior so this gray/white network does not change its existing design.
Roads extend through the surrounding neighborhoods, including West Adams
Boulevard, South Vermont Avenue, South Figueroa Street, Exposition Boulevard,
and Martin Luther King Junior Boulevard.

Reproduce from the downloaded XML tiles with:

```sh
python3 scripts/extract-surrounding-roads.py path/to/surrounding-*.osm
```

This display is not evidence of navigation or geographic accuracy.

## Extrusion heights

`building-heights.json` supplies approximate building massing heights. It is not
an Apple Maps geometry export or a survey. OSM `height` values are used when a
mapped building polygon matches a directory footprint by geometric containment.
Very small tower/chimney polygons are excluded so their heights do not raise an
entire surrounding complex. OSM values remain unverified reported heights.

Where only `building:levels` exists, each level is approximated as 3.5 meters.
USC describes [Webb Tower as 14 stories](https://housing.usc.edu/index.php/buildings/webb-tower-residential-college/)
and the [Village residences as five stories](https://village.usc.edu/about/).
The Village's simplified masses use 18 meters where no height is tagged. Webb
uses its OSM height of 45.4 meters. Remaining typology defaults use 12 meters for
academic buildings, 14 for parking structures, and 6 for small houses/trailers.
Parking lots, an outdoor stadium construction footprint, and the aquatics ground
remain flat; track/tennis stands use a low 4-meter approximation. Each record
stores its source and whether its meters were estimated from floors or typology.

To regenerate these values from the same extract:

```sh
python3 scripts/extract-building-heights.py path/to/campus.osm
```
