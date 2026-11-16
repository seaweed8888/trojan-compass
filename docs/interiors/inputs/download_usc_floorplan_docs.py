#!/usr/bin/env python3
"""Download the USC floor-plan documents listed in the tracker and zip them.

Run it on your own computer (Python 3.8+, nothing to install):

    python3 download_usc_floorplan_docs.py          # download everything, build the zip
    python3 download_usc_floorplan_docs.py --list   # just show what it would fetch

It makes a folder "USC_floor_plan_documents" next to this script, saves every
document it can fetch into it, and then writes "USC_floor_plan_documents.zip".
Inside you also get "_download_report.csv" (what worked, what failed) and
"_open_these_yourself.txt" (links a script can't or shouldn't fetch).

Mac note: if every download fails with CERTIFICATE_VERIFY_FAILED, open
Applications > Python 3.x and double-click "Install Certificates.command" once.
Some files are large (planning reports); the full run can take several minutes.
"""
import csv, json, os, sys, time, zipfile
import urllib.request, urllib.error

OUT_DIR = "USC_floor_plan_documents"
ZIP_NAME = "USC_floor_plan_documents.zip"
USER_AGENT = "Mozilla/5.0 (personal document download; USC floor plan tracker)"
TIMEOUT = 120          # seconds per request
RETRIES = 2            # extra tries after a failure
MAX_BYTES = 400 * 1024 * 1024   # skip anything larger than 400 MB

ITEMS = json.loads(r"""[
 {
  "name": "Leavey Library tour guide (PDF)",
  "buildings": "LVL",
  "folder": "1 Campus buildings",
  "file": "Leavey Library tour guide (PDF)",
  "url": "https://libraries.usc.edu/sites/default/files/2023-10/Leavey_Library_tour_guide.pdf",
  "manual": ""
 },
 {
  "name": "Doheny Memorial Library self-guided tour brochure (PDF)",
  "buildings": "DML",
  "folder": "1 Campus buildings",
  "file": "Doheny Memorial Library self-guided tour brochure (PDF)",
  "url": "https://libraries.usc.edu/sites/default/files/2021-09/Doheny%20Memorial%20Library%20self-guided%20tour%20brochure.pdf",
  "manual": ""
 },
 {
  "name": "East Asian Library floorplan page",
  "buildings": "DML",
  "folder": "1 Campus buildings",
  "file": "East Asian Library floorplan page",
  "url": "https://libraries.usc.edu/locations/east-asian-library/east-asian-library-floorplan",
  "manual": ""
 },
 {
  "name": "Law Library maps",
  "buildings": "LAW",
  "folder": "1 Campus buildings",
  "file": "Law Library maps",
  "url": "https://lawlibguides.usc.edu/library/map",
  "manual": ""
 },
 {
  "name": "Gould School of Law building map (PDF)",
  "buildings": "LAW",
  "folder": "1 Campus buildings",
  "file": "Gould School of Law building map (PDF)",
  "url": "https://gould.usc.edu/resources/downloads/about/visit/building-map.pdf",
  "manual": ""
 },
 {
  "name": "USC Cinematic Arts Complex floorplan map, floors 2-3 (Scribd)",
  "buildings": "SCA SCB SCC SCE SCI SCX",
  "folder": "1 Campus buildings",
  "file": "USC Cinematic Arts Complex floorplan map, floors 2-3 (Scribd)",
  "url": "https://www.scribd.com/document/389173542/USC-Cinematic-Arts-Complex-Floorplan-Map-Floors-2-3",
  "manual": "Scribd needs an account to download; unofficial upload"
 },
 {
  "name": "Map to Cinematic Arts Complex (PDF)",
  "buildings": "SCA SCB SCC SCE SCI SCX",
  "folder": "1 Campus buildings",
  "file": "Map to Cinematic Arts Complex (PDF)",
  "url": "https://cinema.usc.edu/archivedassets/047/10153.pdf",
  "manual": ""
 },
 {
  "name": "School of Cinematic Arts directions and maps",
  "buildings": "SCA NCT RZC",
  "folder": "1 Campus buildings",
  "file": "School of Cinematic Arts directions and maps",
  "url": "https://cinema.usc.edu/about/directionsmaps.cfm",
  "manual": ""
 },
 {
  "name": "USC Architecture Blueprint 2023 program (Issuu)",
  "buildings": "WAH HAR",
  "folder": "1 Campus buildings",
  "file": "USC Architecture Blueprint 2023 program (Issuu)",
  "url": "https://issuu.com/uscarchitecture/docs/2023_blueprint_program",
  "manual": "Flipbook viewer; read it online"
 },
 {
  "name": "Watt Hall Graduate Research Center - CK-Architecture",
  "buildings": "WAH",
  "folder": "1 Campus buildings",
  "file": "Watt Hall Graduate Research Center - CK-Architecture",
  "url": "https://www.ck-architecture.com/usc-graduate-reseach-center",
  "manual": ""
 },
 {
  "name": "Norris Medical Library space pages",
  "buildings": "NML",
  "folder": "3 Outside campus",
  "file": "Norris Medical Library space pages",
  "url": "https://libraries.usc.edu/space/nml-group-study-rooms",
  "manual": ""
 },
 {
  "name": "Tutor Campus Center / Sample Hall building directory",
  "buildings": "TCC SKS",
  "folder": "1 Campus buildings",
  "file": "Tutor Campus Center - Sample Hall building directory",
  "url": "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/building-directory/",
  "manual": ""
 },
 {
  "name": "TCC meeting rooms",
  "buildings": "TCC",
  "folder": "1 Campus buildings",
  "file": "TCC meeting rooms",
  "url": "https://trojanevents.usc.edu/venues/ronald-tutor-campus-center-meeting-rooms/tcc-meeting-rooms/",
  "manual": ""
 },
 {
  "name": "USC Room Finder",
  "buildings": "about 21 classroom buildings",
  "folder": "2 Campus-wide",
  "file": "USC Room Finder",
  "url": "https://roomfinder.usc.edu",
  "manual": ""
 },
 {
  "name": "Room Finder example room page (THH 202)",
  "buildings": "THH",
  "folder": "1 Campus buildings",
  "file": "Room Finder example room page (THH 202)",
  "url": "https://sites.usc.edu/roomfinder/2022/09/07/thh-202",
  "manual": ""
 },
 {
  "name": "Leavey Library group study rooms (booking system)",
  "buildings": "LVL",
  "folder": "1 Campus buildings",
  "file": "Leavey Library group study rooms (booking system)",
  "url": "https://libcal.usc.edu/r/accessible?lid=2895",
  "manual": ""
 },
 {
  "name": "Science & Engineering Library study rooms (booking system)",
  "buildings": "SSL",
  "folder": "1 Campus buildings",
  "file": "Science & Engineering Library study rooms (booking system)",
  "url": "https://libcal.usc.edu/reserve/SEL",
  "manual": ""
 },
 {
  "name": "Health Sciences Campus map 2022 (PDF)",
  "buildings": "HSC buildings",
  "folder": "3 Outside campus",
  "file": "Health Sciences Campus map 2022 (PDF)",
  "url": "https://events.usc.edu/assets/docs/USC-HSC-Map-2022.pdf",
  "manual": ""
 },
 {
  "name": "Schedule of Classes building directory",
  "buildings": "all classroom buildings",
  "folder": "2 Campus-wide",
  "file": "Schedule of Classes building directory",
  "url": "https://classes.usc.edu/building-directory",
  "manual": "Page only loads in a browser"
 },
 {
  "name": "Grand Ballroom stage diagram (PDF)",
  "buildings": "TCC",
  "folder": "1 Campus buildings",
  "file": "Grand Ballroom stage diagram (PDF)",
  "url": "https://trojanevents.usc.edu/wp-content/uploads/2022/12/Grand-Ballroom-Diagrams1.pdf",
  "manual": ""
 },
 {
  "name": "Grand Ballroom diagram, A/B/C/D dimensions (PDF)",
  "buildings": "TCC",
  "folder": "1 Campus buildings",
  "file": "Grand Ballroom diagram, A-B-C-D dimensions (PDF)",
  "url": "https://trojanevents.usc.edu/wp-content/uploads/2023/01/Grand-Ballroom-Diagrams2.pdf",
  "manual": ""
 },
 {
  "name": "Grand Ballroom diagram, ABCD dimensions (PDF)",
  "buildings": "TCC",
  "folder": "1 Campus buildings",
  "file": "Grand Ballroom diagram, ABCD dimensions (PDF)",
  "url": "https://trojanevents.usc.edu/wp-content/uploads/2023/01/Grand-Ballroom-Diagrams3.pdf",
  "manual": ""
 },
 {
  "name": "Grand Ballroom diagram, empty room (PDF)",
  "buildings": "TCC",
  "folder": "1 Campus buildings",
  "file": "Grand Ballroom diagram, empty room (PDF)",
  "url": "https://trojanevents.usc.edu/wp-content/uploads/2023/01/Grand-Ballroom-Diagrams4.pdf",
  "manual": ""
 },
 {
  "name": "Tommy's Place diagrams",
  "buildings": "TCC",
  "folder": "1 Campus buildings",
  "file": "Tommy's Place diagrams",
  "url": "https://trojanevents.usc.edu/venues/tommys-place-traditions/tommys-place/tommys-place-diagrams/",
  "manual": ""
 },
 {
  "name": "Traditions diagrams",
  "buildings": "TCC",
  "folder": "1 Campus buildings",
  "file": "Traditions diagrams",
  "url": "https://trojanevents.usc.edu/venues/tommys-place-traditions/traditions/traditions-diagrams/",
  "manual": ""
 },
 {
  "name": "Outdoor venue diagrams",
  "buildings": "campus plazas and parks",
  "folder": "2 Campus-wide",
  "file": "Outdoor venue diagrams",
  "url": "https://trojanevents.usc.edu/venues/outdoor-venues/outdoor-diagrams/",
  "manual": ""
 },
 {
  "name": "Bovard Auditorium technical information",
  "buildings": "ADM",
  "folder": "1 Campus buildings",
  "file": "Bovard Auditorium technical information",
  "url": "https://trojanevents.usc.edu/venues/bovard-auditorium-south-hall/technical-information/",
  "manual": ""
 },
 {
  "name": "Bovard technical specifications packet (Google Drive)",
  "buildings": "ADM",
  "folder": "1 Campus buildings",
  "file": "Bovard technical specifications packet (Google Drive)",
  "url": "https://drive.google.com/file/d/1TCi0jg4p9-GiGyWsqGJnHJ7CbwTQImMt/view",
  "manual": "Google Drive file: open it and use Download"
 },
 {
  "name": "Scene Dock Theatre technical resources (Google Doc)",
  "buildings": "SCD",
  "folder": "1 Campus buildings",
  "file": "Scene Dock Theatre technical resources (Google Doc)",
  "url": "https://docs.google.com/document/d/1D5RHgjOoHRmxnRnx1vVxbnnuwAYkRY3YGHEWpaWb-fg/edit",
  "manual": "Google Doc with many linked files: open it and download the drawings you need"
 },
 {
  "name": "Scene Dock Theatre technical specifications 2020 (PDF)",
  "buildings": "SCD",
  "folder": "1 Campus buildings",
  "file": "Scene Dock Theatre technical specifications 2020 (PDF)",
  "url": "https://dramaticarts.usc.edu/wp-content/uploads/2020/10/SceneDockTheatre_TechnicalSpecs_2020-2.pdf",
  "manual": ""
 },
 {
  "name": "Scene Dock Theatre 360 tour",
  "buildings": "SCD",
  "folder": "1 Campus buildings",
  "file": "Scene Dock Theatre 360 tour",
  "url": "https://momento360.com/e/uc/7364949ab47d4f0c9edca8011f607a73",
  "manual": "Interactive 360 tour, nothing to download"
 },
 {
  "name": "Bing Theatre page",
  "buildings": "BIT",
  "folder": "1 Campus buildings",
  "file": "Bing Theatre page",
  "url": "https://dramaticarts.usc.edu/about/theatres/bing/",
  "manual": ""
 },
 {
  "name": "Bing Theatre technical resources (Google Doc)",
  "buildings": "BIT",
  "folder": "1 Campus buildings",
  "file": "Bing Theatre technical resources (Google Doc)",
  "url": "https://docs.google.com/document/d/11wzmq0VaDiWJY75dz8Of8ZTxJGykHToRbekNtKSsycs/edit",
  "manual": "Google Doc with many linked files: open it and download the drawings you need"
 },
 {
  "name": "Bing Theatre 360 tour",
  "buildings": "BIT",
  "folder": "1 Campus buildings",
  "file": "Bing Theatre 360 tour",
  "url": "https://momento360.com/e/uc/c24acead635240ccbb3e824e9563dc96",
  "manual": "Interactive 360 tour, nothing to download"
 },
 {
  "name": "McClintock Theatre page",
  "buildings": "MCC",
  "folder": "1 Campus buildings",
  "file": "McClintock Theatre page",
  "url": "https://dramaticarts.usc.edu/about/theatres/mcclintock",
  "manual": ""
 },
 {
  "name": "McClintock Theatre technical specifications 2012 (PDF)",
  "buildings": "MCC",
  "folder": "1 Campus buildings",
  "file": "McClintock Theatre technical specifications 2012 (PDF)",
  "url": "https://dramaticarts.usc.edu/files/2014/08/mcclintock_theatre_technical_specs_2012.pdf",
  "manual": ""
 },
 {
  "name": "USC Hotel meeting and event venues",
  "buildings": "USH DCC",
  "folder": "3 Outside campus",
  "file": "USC Hotel meeting and event venues",
  "url": "https://uschotel.usc.edu/meetings-events/venues",
  "manual": ""
 },
 {
  "name": "USC Hotel venue listing (Cvent)",
  "buildings": "USH",
  "folder": "3 Outside campus",
  "file": "USC Hotel venue listing (Cvent)",
  "url": "https://www.cvent.com/venues/los-angeles/hotel/usc-hotel-private-events-conferences/venue-2145374f-ac54-42dc-a359-9ba26951009f",
  "manual": "Interactive listing, view it online"
 },
 {
  "name": "Coliseum Promoter Guide (PDF)",
  "buildings": "CLS",
  "folder": "3 Outside campus",
  "file": "Coliseum Promoter Guide (PDF)",
  "url": "https://lacoliseum.com/wp-content/uploads/2025/01/Promoter_Guide.pdf",
  "manual": ""
 },
 {
  "name": "Coliseum Renovation Project Draft EIR, 2003 (PDF)",
  "buildings": "CLS",
  "folder": "3 Outside campus",
  "file": "Coliseum Renovation Project Draft EIR, 2003 (PDF)",
  "url": "https://expositionpark.ca.gov/epmp/2003%2bEIR%2bLA%2bMemorial%2bColiseum%2bRenovation%2bProject.pdf",
  "manual": ""
 },
 {
  "name": "Coliseum Renovation summary report, 2005 (PDF)",
  "buildings": "CLS",
  "folder": "3 Outside campus",
  "file": "Coliseum Renovation summary report, 2005 (PDF)",
  "url": "https://expositionpark.ca.gov/epmp/2005%2BLos%2BAngeles%2BMemorial%2BColiseum%2BRenovation%2BSummary%2BReport%2Bfor%2BCultural%2BHeritage%2BCommission.pdf",
  "manual": ""
 },
 {
  "name": "LA City Planning staff report CPC-2016-4382 (PDF)",
  "buildings": "CLS",
  "folder": "3 Outside campus",
  "file": "LA City Planning staff report CPC-2016-4382 (PDF)",
  "url": "https://planning.lacity.gov/StaffRpt/InitialRpts/CPC-2016-4382.pdf",
  "manual": ""
 },
 {
  "name": "USC Housing building pages",
  "buildings": "residence buildings",
  "folder": "2 Campus-wide",
  "file": "USC Housing building pages",
  "url": "https://housing.usc.edu",
  "manual": ""
 },
 {
  "name": "USC Housing - Webb Tower",
  "buildings": "WTO",
  "folder": "1 Campus buildings",
  "file": "USC Housing - Webb Tower",
  "url": "https://housing.usc.edu/index.php/buildings/webb-tower-residential-college/",
  "manual": ""
 },
 {
  "name": "USC Housing - Annenberg House",
  "buildings": "ANH",
  "folder": "3 Outside campus",
  "file": "USC Housing - Annenberg House",
  "url": "https://housing.usc.edu/index.php/buildings/annenberg-house/",
  "manual": ""
 },
 {
  "name": "USC Housing - Cale and Irani Residential College",
  "buildings": "CIC",
  "folder": "1 Campus buildings",
  "file": "USC Housing - Cale and Irani Residential College",
  "url": "https://housing.usc.edu/index.php/buildings/usc-village-building-6/",
  "manual": ""
 },
 {
  "name": "USC Village undergraduate housing info sheet, 2017",
  "buildings": "USC Village colleges",
  "folder": "2 Campus-wide",
  "file": "USC Village undergraduate housing info sheet, 2017",
  "url": "https://housing.usc.edu/village-und-info-2017-2",
  "manual": ""
 },
 {
  "name": "Chan Division 360 virtual tour",
  "buildings": "CHP",
  "folder": "3 Outside campus",
  "file": "Chan Division 360 virtual tour",
  "url": "https://chan.usc.edu/about-us/virtual-tour",
  "manual": ""
 },
 {
  "name": "Wallis Annenberg Hall 360 tour",
  "buildings": "ANN",
  "folder": "1 Campus buildings",
  "file": "Wallis Annenberg Hall 360 tour",
  "url": "https://annenberg.org/?p=288",
  "manual": ""
 },
 {
  "name": "USC University Park Specific Plan",
  "buildings": "University Park campus",
  "folder": "2 Campus-wide",
  "file": "USC University Park Specific Plan",
  "url": "https://planning.lacity.gov/plans-policies/overlays/usc",
  "manual": ""
 },
 {
  "name": "USC Specific Plan EIR, Appendix C-2 Historic Resources Evaluation (PDF)",
  "buildings": "older UPC buildings",
  "folder": "2 Campus-wide",
  "file": "USC Specific Plan EIR, Appendix C-2 Historic Resources Evaluation (PDF)",
  "url": "https://planning.lacity.gov/EIR/USC/FEIR/files/USC%20Appendix%20C-2%20Historic%20Resources%20Evaluation%20University%20Pa.pdf",
  "manual": ""
 },
 {
  "name": "USC Development Plan EIR, Project Description (PDF)",
  "buildings": "University Park campus",
  "folder": "2 Campus-wide",
  "file": "USC Development Plan EIR, Project Description (PDF)",
  "url": "https://planning.lacity.gov/eir/USC/FEIR/files/II.%20%20Project_Description.pdf",
  "manual": ""
 },
 {
  "name": "Iovine and Young Hall - World-Architects feature",
  "buildings": "IYH",
  "folder": "1 Campus buildings",
  "file": "Iovine and Young Hall - World-Architects feature",
  "url": "https://www.world-architects.com/en/architecture-news/building-of-the-week/iovine-and-young-hall",
  "manual": ""
 },
 {
  "name": "Iovine and Young Hall - Architect Magazine",
  "buildings": "IYH",
  "folder": "1 Campus buildings",
  "file": "Iovine and Young Hall - Architect Magazine",
  "url": "https://www.architectmagazine.com/project-gallery/iovine-and-young-hall/",
  "manual": ""
 },
 {
  "name": "Dauterive Hall - HKS",
  "buildings": "VPD",
  "folder": "1 Campus buildings",
  "file": "Dauterive Hall - HKS",
  "url": "https://www.hksinc.com/what-we-do/projects/usc-dr-verna-and-peter-dauterive-hall/",
  "manual": ""
 },
 {
  "name": "Watt Hall addition - Architizer",
  "buildings": "WAH",
  "folder": "1 Campus buildings",
  "file": "Watt Hall addition - Architizer",
  "url": "https://architizer.com/projects/the-robert-h-timme-faia-graduate-research-center-at-the-usc-school-of-architecture",
  "manual": ""
 },
 {
  "name": "School of Cinematic Arts Phase III - MATT Construction",
  "buildings": "SCA complex",
  "folder": "1 Campus buildings",
  "file": "School of Cinematic Arts Phase III - MATT Construction",
  "url": "https://mattconstruction.com/?p=2492",
  "manual": ""
 },
 {
  "name": "Wallis Annenberg Hall - Architect Magazine",
  "buildings": "ANN",
  "folder": "1 Campus buildings",
  "file": "Wallis Annenberg Hall - Architect Magazine",
  "url": "https://www.architectmagazine.com/?p=226395",
  "manual": ""
 },
 {
  "name": "FPM building list map, University Park (PDF)",
  "buildings": "all UPC buildings",
  "folder": "2 Campus-wide",
  "file": "FPM building list map, University Park (PDF)",
  "url": "https://fpmgis.usc.edu/portal/sharing/rest/content/items/4fa57eb8ab3748659e047a9cb836d95c/data",
  "manual": ""
 },
 {
  "name": "FPM building list map, Health Sciences (PDF)",
  "buildings": "all HSC buildings",
  "folder": "3 Outside campus",
  "file": "FPM building list map, Health Sciences (PDF)",
  "url": "https://fpmgis.usc.edu/portal/sharing/rest/content/items/4d4fc07a86bf47c39596aa6e62519d3e/data",
  "manual": ""
 },
 {
  "name": "FPM building list map, Catalina (PDF)",
  "buildings": "Catalina buildings",
  "folder": "3 Outside campus",
  "file": "FPM building list map, Catalina (PDF)",
  "url": "https://fpmgis.usc.edu/portal/sharing/rest/content/items/9f32acf67df941888a52f802d1905c61/data",
  "manual": "This file was blocked to automated access; open it in your browser and save it"
 },
 {
  "name": "FPM interactive campus map",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "FPM interactive campus map",
  "url": "https://fpmgis.usc.edu/portal/apps/dashboards/1b055f164d5d45669d2e40d3c9a0dce0",
  "manual": "Interactive map, nothing to download"
 },
 {
  "name": "USC interactive campus map",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "USC interactive campus map",
  "url": "https://maps.usc.edu/?id=1928#!ct/53722,53723,55414,55415,55418?s/",
  "manual": "Interactive map, nothing to download"
 },
 {
  "name": "FPM maps hub",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "FPM maps hub",
  "url": "https://fpm.usc.edu/maps/",
  "manual": ""
 },
 {
  "name": "Buildings with 3D Models dashboard",
  "buildings": "buildings with 3D models",
  "folder": "2 Campus-wide",
  "file": "Buildings with 3D Models dashboard",
  "url": "https://www.arcgis.com/apps/dashboards/cf72ccdf3d914085a414a8dd93ced3db",
  "manual": "Interactive dashboard, nothing to download"
 },
 {
  "name": "Construction projects dashboard",
  "buildings": "buildings under construction",
  "folder": "2 Campus-wide",
  "file": "Construction projects dashboard",
  "url": "https://fpmgis.usc.edu/portal/apps/dashboards/cf4d229b01ac48de8d58fc1204e0eb45",
  "manual": "Interactive dashboard, nothing to download"
 },
 {
  "name": "All-gender bathrooms dashboard, University Park",
  "buildings": "UPC buildings",
  "folder": "2 Campus-wide",
  "file": "All-gender bathrooms dashboard, University Park",
  "url": "https://uscfms.maps.arcgis.com/apps/dashboards/72c0e553125c44b4855362f8724c9476",
  "manual": "Interactive dashboard, nothing to download"
 },
 {
  "name": "All-gender bathrooms dashboard, Health Sciences",
  "buildings": "HSC buildings",
  "folder": "3 Outside campus",
  "file": "All-gender bathrooms dashboard, Health Sciences",
  "url": "https://uscfms.maps.arcgis.com/apps/dashboards/4362976712dc406cacc5f72335a4eebb",
  "manual": "Interactive dashboard, nothing to download"
 },
 {
  "name": "Bottle filling stations map, University Park (PDF)",
  "buildings": "UPC buildings",
  "folder": "2 Campus-wide",
  "file": "Bottle filling stations map, University Park (PDF)",
  "url": "https://fpmgis.usc.edu/portal/sharing/rest/content/items/48362e8c50a44e89af5583377392c13d/data",
  "manual": ""
 },
 {
  "name": "Bottle filling stations map, Health Sciences (PDF)",
  "buildings": "HSC buildings",
  "folder": "3 Outside campus",
  "file": "Bottle filling stations map, Health Sciences (PDF)",
  "url": "https://fpmgis.usc.edu/portal/sharing/rest/content/items/95dc908baf3e4b5db2d16de3db72ca90/data",
  "manual": ""
 },
 {
  "name": "Lactation room location map",
  "buildings": "UPC and HSC buildings",
  "folder": "2 Campus-wide",
  "file": "Lactation room location map",
  "url": "https://fpmgis.usc.edu/portal/apps/experiencebuilder/experience/?id=9983a6decc0548c892b480c997724993",
  "manual": "Interactive map, nothing to download"
 },
 {
  "name": "University Park visitor map 2022 (PDF)",
  "buildings": "UPC buildings",
  "folder": "2 Campus-wide",
  "file": "University Park visitor map 2022 (PDF)",
  "url": "https://events.usc.edu/assets/docs/USC-UPC-Map-2022.pdf",
  "manual": ""
 },
 {
  "name": "Combined print map, 2022 (PDF)",
  "buildings": "UPC and HSC buildings",
  "folder": "2 Campus-wide",
  "file": "Combined print map, 2022 (PDF)",
  "url": "https://assets.concept3d.com/assets/1928/USC_UTC_HSC_Combined2022.pdf",
  "manual": ""
 },
 {
  "name": "University Park 3D letter map (PDF)",
  "buildings": "UPC buildings",
  "folder": "2 Campus-wide",
  "file": "University Park 3D letter map (PDF)",
  "url": "https://music.usc.edu/wp-content/uploads/2023/05/UPC-Campus-Maps_3D-Letter-Map_FINAL.pdf",
  "manual": ""
 },
 {
  "name": "Keck Medicine system location map (PDF)",
  "buildings": "UNH NOR HC1 HC2",
  "folder": "3 Outside campus",
  "file": "Keck Medicine system location map (PDF)",
  "url": "https://www.keckmedicine.org/wp-content/uploads/2026/07/System-Location-Map.pdf",
  "manual": ""
 },
 {
  "name": "Health Sciences patient map (PDF)",
  "buildings": "HSC patient-care buildings",
  "folder": "3 Outside campus",
  "file": "Health Sciences patient map (PDF)",
  "url": "https://www.keckmedicine.org/wp-content/uploads/2022/02/HSC-Patient-Map.pdf",
  "manual": ""
 },
 {
  "name": "Keck Medical Center patient handbook (PDF)",
  "buildings": "UNH NOR",
  "folder": "3 Outside campus",
  "file": "Keck Medical Center patient handbook (PDF)",
  "url": "https://www.keckmedicine.org/wp-content/uploads/2026/06/Keck-Medical-Center-Patient-Handbook.pdf",
  "manual": ""
 },
 {
  "name": "Building emergency fact sheets index",
  "buildings": "every building",
  "folder": "2 Campus-wide",
  "file": "Building emergency fact sheets index",
  "url": "https://fsep.usc.edu/?p=2753",
  "manual": ""
 },
 {
  "name": "USC CAD Guidelines (PDF)",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "USC CAD Guidelines (PDF)",
  "url": "https://fpm.usc.edu/wp-content/uploads/2022/02/CAD_Guidelines.pdf",
  "manual": ""
 },
 {
  "name": "USC Facility Design Guidelines, 2023 (PDF)",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "USC Facility Design Guidelines, 2023 (PDF)",
  "url": "https://fpm.usc.edu/wp-content/uploads/2023/07/USC-Facility-Design-Guidelines-30JUL23.pdf",
  "manual": ""
 },
 {
  "name": "USC BIM Standards, 2017 (PDF)",
  "buildings": "newer buildings",
  "folder": "2 Campus-wide",
  "file": "USC BIM Standards, 2017 (PDF)",
  "url": "https://fpm.usc.edu/wp-content/uploads/2021/11/BIM-Standards-USC-PRxP_2017.pdf",
  "manual": ""
 },
 {
  "name": "USC General Standard Guidelines (PDF)",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "USC General Standard Guidelines (PDF)",
  "url": "https://fpm.usc.edu/wp-content/uploads/2021/11/General_StandardGuidelines.pdf",
  "manual": ""
 },
 {
  "name": "Project Record Documents specification (PDF)",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "Project Record Documents specification (PDF)",
  "url": "https://fpm.usc.edu/wp-content/uploads/2021/11/017839-PROJECT-RECORD-DOCUMENTS-2016-05-18-FINAL.pdf",
  "manual": ""
 },
 {
  "name": "Department of Space Management",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "Department of Space Management",
  "url": "https://fbs.usc.edu/space-management/",
  "manual": ""
 },
 {
  "name": "FMS building list",
  "buildings": "all buildings",
  "folder": "2 Campus-wide",
  "file": "FMS building list",
  "url": "http://fmsmaps4.usc.edu/usc/php/bl_list_no.php?col=code&order=asc",
  "manual": "USC's facilities site blocks automated access; open it in your browser"
 },
 {
  "name": "FMS facilities report example (Stonier Hall)",
  "buildings": "STO",
  "folder": "1 Campus buildings",
  "file": "FMS facilities report example (Stonier Hall)",
  "url": "http://fmsmaps4.usc.edu/usc/php/facilities.php?OBJ_KEYS=114",
  "manual": "USC's facilities site blocks automated access; open it in your browser"
 },
 {
  "name": "Keck School Space Planning",
  "buildings": "HSC buildings",
  "folder": "3 Outside campus",
  "file": "Keck School Space Planning",
  "url": "https://keck.usc.edu/space-planning/",
  "manual": ""
 },
 {
  "name": "USC history collections (University Archives)",
  "buildings": "older buildings",
  "folder": "2 Campus-wide",
  "file": "USC history collections (University Archives)",
  "url": "https://libraries.usc.edu/locations/special-collections/usc-history",
  "manual": ""
 },
 {
  "name": "William L. Pereira & Associates records",
  "buildings": "1960s-70s campus buildings",
  "folder": "2 Campus-wide",
  "file": "William L. Pereira & Associates records",
  "url": "https://archives.usc.edu/repositories/3/resources/328",
  "manual": ""
 },
 {
  "name": "Spatial Sciences Institute 3D campus research",
  "buildings": "AHF and others",
  "folder": "2 Campus-wide",
  "file": "Spatial Sciences Institute 3D campus research",
  "url": "https://spatial.usc.edu/ssi-research-integrates-architectural-data-3d-gis-tools/",
  "manual": ""
 },
 {
  "name": "3D4E printed campus model",
  "buildings": "about 150 buildings",
  "folder": "2 Campus-wide",
  "file": "3D4E printed campus model",
  "url": "https://viterbischool.usc.edu/news/2018/02/3d4e-takes-printing-another-level/",
  "manual": ""
 },
 {
  "name": "LA County building outlines layer",
  "buildings": "every building",
  "folder": "2 Campus-wide",
  "file": "LA County building outlines layer",
  "url": "https://rpgis.isd.lacounty.gov/arcgis/rest/services/GISNET_Public/MapServer/434",
  "manual": ""
 },
 {
  "name": "OpenStreetMap LA buildings import notes",
  "buildings": "every building",
  "folder": "2 Campus-wide",
  "file": "OpenStreetMap LA buildings import notes",
  "url": "https://wiki.openstreetmap.org/wiki/Los_Angeles,_California/Buildings_Import",
  "manual": ""
 },
 {
  "name": "OpenStreetMap example: Loker Hall",
  "buildings": "LHI",
  "folder": "1 Campus buildings",
  "file": "OpenStreetMap example- Loker Hall",
  "url": "https://www.openstreetmap.org/way/406923939",
  "manual": ""
 },
 {
  "name": "LARIAC imagery and LiDAR program",
  "buildings": "every building",
  "folder": "2 Campus-wide",
  "file": "LARIAC imagery and LiDAR program",
  "url": "https://lariac-lacounty.hub.arcgis.com",
  "manual": "Data portal, browse it online"
 },
 {
  "name": "East Asian Library reading-room map (image)",
  "buildings": "DML",
  "folder": "1 Campus buildings",
  "file": "East Asian Library reading-room map (image)",
  "url": "https://libraries.usc.edu/sites/default/files/images/page/dmlealmap_4.jpg",
  "manual": ""
 },
 {
  "name": "East Asian Library stack map (image)",
  "buildings": "DML",
  "folder": "1 Campus buildings",
  "file": "East Asian Library stack map (image)",
  "url": "https://libraries.usc.edu/sites/default/files/images/page/stack-final-final_0.jpg",
  "manual": ""
 }
]""")

EXT_BY_TYPE = {
    "application/pdf": ".pdf", "text/html": ".html", "image/jpeg": ".jpg",
    "image/png": ".png", "application/json": ".json", "text/plain": ".txt",
    "application/zip": ".zip",
}


def extension(content_type, url, first_bytes):
    """Pick a file extension from the server's answer, the bytes, then the URL."""
    if first_bytes.startswith(b"%PDF"):
        return ".pdf"
    ctype = (content_type or "").split(";")[0].strip().lower()
    if ctype in EXT_BY_TYPE:
        return EXT_BY_TYPE[ctype]
    tail = url.split("?")[0].rsplit("/", 1)[-1]
    if "." in tail and len(tail.rsplit(".", 1)[-1]) <= 5:
        return "." + tail.rsplit(".", 1)[-1].lower()
    return ".html"


def fetch(url, dest_without_ext):
    """Download url. Returns (path, bytes_written). Raises on failure."""
    request = urllib.request.Request(url.split("#")[0], headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
        first = response.read(8192)
        path = dest_without_ext + extension(response.headers.get("Content-Type"), url, first)
        written = 0
        with open(path, "wb") as handle:
            chunk = first
            while chunk:
                written += len(chunk)
                if written > MAX_BYTES:
                    raise IOError("larger than %d MB, skipped" % (MAX_BYTES // 2**20))
                handle.write(chunk)
                chunk = response.read(1 << 16)
    return path, written


def fetch_with_retries(url, dest_without_ext):
    last_error = None
    for attempt in range(RETRIES + 1):
        try:
            return fetch(url, dest_without_ext)
        except (urllib.error.URLError, IOError, OSError, ValueError) as error:
            last_error = error
            time.sleep(2 * (attempt + 1))
    raise last_error


def main():
    automatic = [item for item in ITEMS if not item["manual"]]
    manual = [item for item in ITEMS if item["manual"]]
    if "--list" in sys.argv:
        for item in automatic:
            print("GET   %-22s %s" % (item["folder"], item["name"]))
        for item in manual:
            print("SKIP  %s  (%s)" % (item["name"], item["manual"]))
        print("\n%d to download, %d to open yourself" % (len(automatic), len(manual)))
        return 0

    os.makedirs(OUT_DIR, exist_ok=True)
    report = []
    for number, item in enumerate(automatic, 1):
        folder = os.path.join(OUT_DIR, item["folder"])
        os.makedirs(folder, exist_ok=True)
        print("[%d/%d] %s" % (number, len(automatic), item["name"]), flush=True)
        try:
            path, size = fetch_with_retries(item["url"], os.path.join(folder, item["file"]))
            report.append([item["name"], item["buildings"], "saved", os.path.relpath(path, OUT_DIR), size, item["url"], ""])
        except Exception as error:   # keep going; the report says what failed
            print("      failed: %s" % error)
            report.append([item["name"], item["buildings"], "FAILED", "", 0, item["url"], str(error)])
    for item in manual:
        report.append([item["name"], item["buildings"], "open yourself", "", 0, item["url"], item["manual"]])

    with open(os.path.join(OUT_DIR, "_download_report.csv"), "w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["Document", "Building(s)", "Status", "Saved as", "Bytes", "Link", "Note"])
        writer.writerows(report)
    with open(os.path.join(OUT_DIR, "_open_these_yourself.txt"), "w", encoding="utf-8") as handle:
        handle.write("These links are not in the zip. Open each one in your browser.\n\n")
        for item in manual:
            handle.write("%s\n  %s\n  Why: %s\n\n" % (item["name"], item["url"], item["manual"]))
        failed = [row for row in report if row[2] == "FAILED"]
        if failed:
            handle.write("\nThese downloads failed when the script ran. Try them in your browser.\n\n")
            for row in failed:
                handle.write("%s\n  %s\n  Error: %s\n\n" % (row[0], row[5], row[6]))

    with zipfile.ZipFile(ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as archive:
        for root, _dirs, files in os.walk(OUT_DIR):
            for name in sorted(files):
                full = os.path.join(root, name)
                archive.write(full, os.path.relpath(full, os.path.dirname(os.path.abspath(OUT_DIR)) or "."))
    saved = sum(1 for row in report if row[2] == "saved")
    failed = sum(1 for row in report if row[2] == "FAILED")
    print("\nSaved %d, failed %d, left for you to open %d." % (saved, failed, len(manual)))
    print("Zip written: %s" % os.path.abspath(ZIP_NAME))
    return 0


if __name__ == "__main__":
    sys.exit(main())
