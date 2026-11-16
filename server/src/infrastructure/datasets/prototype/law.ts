// Preserved prototype source; canonical runtime data is exported to server/data/snapshots/.
/**
 * Musick Law Building (USC Gould School of Law), traced from the Gould building map PDF
 * (gould.usc.edu/resources/downloads/about/visit/building-map.pdf, 2022).
 *
 * Source coordinates are page positions on that PDF (portrait, north entrance at the top).
 * The plan is rotated so its long axis runs left to right in the 3D scene.
 */

export type Rect = [number, number, number, number]
export type Side = 'N' | 'S' | 'E' | 'W'

/** [number, name, kind, page rect, door side, sq ft?, pill label?] */
export type RoomSpec = [string, string, string, Rect, Side, number?, string?]

export interface LawFloorSpec {
  level: number
  slabs: Rect[]
  rooms: RoomSpec[]
  /** Corridor centerlines as page-coordinate polylines. */
  walks: [number, number][][]
  entrances?: { id: string; at: [number, number]; label: string; stepFree: boolean; ramp?: boolean; entrance: boolean }[]
}

// kind: r = room, o = open area, b = non-public block, w = restrooms, s:<core> = stairs, e:<core> = elevator
export const LAW_SPEC: LawFloorSpec[] = [
  {
    level: 0,
    slabs: [
      [480, 362, 880, 530],
      [435, 530, 940, 1045],
      [480, 1045, 925, 1310],
      [555, 1310, 965, 1500],
    ],
    rooms: [
      ['1', 'Classroom', 'r', [480, 365, 878, 528], 'S', 2463],
      ['3', 'Classroom', 'r', [550, 565, 805, 745], 'N', 2463],
      ['7', 'Classroom', 'r', [550, 855, 805, 1008], 'S', 1938],
      ['2', 'Classroom', 'r', [435, 828, 523, 990], 'E', 865],
      ['12', 'Seminar Room', 'r', [833, 828, 940, 990], 'W', 1008],
      ['18', 'Affinity Group Lounge', 'r', [833, 605, 922, 705], 'W', 505],
      ['16', 'Law Journals', 'r', [833, 705, 940, 758], 'W', 198],
      ['17', 'Moot Court Office', 'r', [760, 750, 805, 835], 'E', 239],
      ['4', 'Student Bar Association', 'r', [435, 990, 523, 1045], 'E', 139],
      ['6', 'PILF Office', 'r', [472, 1050, 562, 1092], 'E', 156],
      ['B9', 'Dining Room', 'o', [480, 1140, 720, 1305], 'N', 2242],
      ['B9F', 'Student Lockers', 'o', [790, 1085, 925, 1290], 'W', 1314],
      ['', 'Restrooms', 'w', [665, 755, 745, 850], 'W'],
      ['', 'Restrooms', 'w', [720, 1055, 770, 1150], 'N'],
      ['', 'West stairs', 's:NW', [485, 770, 520, 820], 'E'],
      ['', 'East stairs', 's:NE', [840, 760, 885, 800], 'W'],
      ['', 'South-west stairs', 's:SW', [487, 1095, 548, 1135], 'E'],
      ['', 'South-east stairs', 's:SE', [835, 1340, 875, 1380], 'W'],
      ['', 'Central elevator', 'e:EC', [600, 760, 640, 790], 'S'],
      ['', 'South elevator', 'e:ES', [795, 1370, 835, 1405], 'N'],
      ['', 'Mechanical', 'b', [440, 545, 523, 750], 'E'],
      ['', 'Mechanical', 'b', [555, 1410, 965, 1500], 'N'],
    ],
    walks: [
      [[537, 545], [819, 545], [819, 1027], [537, 1027], [537, 545]],
      [[537, 800], [655, 800]],
      [[580, 1027], [580, 1140], [580, 1235], [490, 1235]],
      [[780, 1027], [780, 1187], [780, 1360]],
    ],
    entrances: [{ id: 'patio', at: [482, 1235], label: 'dining patio exit', stepFree: true, entrance: false }],
  },
  {
    level: 1,
    slabs: [
      [372, 535, 808, 1060],
      [405, 1060, 808, 1410],
      [587, 1410, 808, 1487],
    ],
    rooms: [
      ['100', 'Personnel & Undergraduate Programs', 'r', [372, 622, 487, 722], 'E', 447],
      ['104', 'Student Affairs Office', 'r', [372, 785, 482, 1020], 'E', 760],
      ['101', 'Classroom', 'r', [512, 607, 668, 720], 'W', 1301],
      ['103', 'Classroom', 'r', [512, 812, 668, 925], 'W', 1300],
      ['130', 'Classroom', 'r', [695, 607, 808, 720], 'W', 1045],
      ['124', 'Admissions & Financial Aid', 'r', [695, 785, 806, 1005], 'W', 584],
      ['107', 'Courtroom', 'r', [550, 1085, 702, 1210], 'E', 1311],
      ['106', 'Seminar Room', 'r', [487, 1090, 550, 1195], 'N', 444],
      ['105', 'Graduate & International Programs', 'r', [407, 1088, 487, 1230], 'N', 295],
      ['120', 'Seminar Room', 'r', [728, 1085, 806, 1160], 'W', 391],
      ['118', 'Seminar Room', 'r', [728, 1160, 806, 1235], 'W', 430],
      ['114', 'Seminar Room', 'r', [728, 1298, 806, 1410], 'W', 628],
      ['110', 'Career Services Office', 'r', [587, 1410, 808, 1487], 'N', 439],
      ['', 'Restrooms', 'w', [548, 722, 668, 810], 'E'],
      ['', 'Restrooms', 'w', [580, 1295, 700, 1385], 'E'],
      ['', 'North-west stairs', 's:NW', [450, 585, 487, 620], 'S'],
      ['', 'North-east stairs', 's:NE', [745, 540, 805, 590], 'W'],
      ['', 'South-west stairs', 's:SW', [470, 1240, 550, 1280], 'N'],
      ['', 'South-east stairs', 's:SE', [728, 1240, 800, 1280], 'W'],
      ['', 'Central elevators', 'e:EC', [512, 728, 546, 768], 'W'],
      ['', 'South elevator', 'e:ES', [620, 1240, 660, 1280], 'N'],
    ],
    walks: [
      [[487, 560], [590, 560], [682, 560], [720, 560]],
      [[500, 560], [500, 752], [500, 1050]],
      [[682, 560], [682, 752], [682, 1050]],
      [[682, 752], [800, 752]],
      [[420, 1050], [500, 1050], [682, 1050], [715, 1050], [800, 1050]],
      [[715, 1050], [715, 1225], [715, 1400]],
      [[500, 1225], [640, 1225], [715, 1225]],
    ],
    entrances: [
      { id: 'entrance', at: [590, 535], label: 'north main entrance', stepFree: false, entrance: true },
      { id: 'east', at: [808, 1050], label: 'east ramp entrance', stepFree: true, ramp: true, entrance: true },
      { id: 'west', at: [405, 1050], label: 'west entrance', stepFree: false, entrance: true },
    ],
  },
  {
    level: 2,
    slabs: [
      [350, 355, 905, 910],
      [430, 910, 905, 1165],
      [510, 1165, 905, 1330],
      [590, 1330, 905, 1490],
    ],
    rooms: [
      ['205', 'Law Library Reading Room', 'o', [755, 380, 895, 1300], 'W'],
      ['202', 'Library Administration', 'r', [350, 355, 428, 595], 'E'],
      ['', 'Lincoln Meeting Room', 'r', [430, 495, 508, 568], 'E', undefined, 'Lincoln'],
      ['203', 'Library Service Counter', 'o', [555, 420, 668, 600], 'S'],
      ['201', 'Reference Desk', 'r', [670, 408, 727, 515], 'E'],
      ['206', 'Library Budget Office', 'r', [350, 808, 475, 910], 'E'],
      ['227', 'Study Room', 'r', [662, 840, 740, 874], 'E'],
      ['225', 'Study Room', 'r', [688, 874, 740, 910], 'E'],
      ['223-IT', 'IT Help Desk', 'r', [686, 910, 740, 957], 'E', undefined, 'IT'],
      ['205-LAB', 'Computer Lab', 'r', [628, 874, 686, 957], 'N', undefined, 'Lab'],
      ['223', 'Library Classroom', 'r', [628, 957, 740, 1093], 'E'],
      ['221', 'Library Classroom', 'r', [628, 1093, 740, 1170], 'S'],
      ['211', 'Turrentine Conference Room', 'r', [508, 948, 626, 1029], 'W'],
      ['213', 'Library Classroom', 'r', [508, 1029, 626, 1110], 'W'],
      ['215', 'Study Room', 'r', [508, 1110, 568, 1170], 'S', 194],
      ['217', 'Study Room', 'r', [568, 1110, 626, 1170], 'S', 195],
      ['212', 'Study Room', 'r', [430, 1012, 478, 1090], 'E'],
      ['214', 'Study Room', 'r', [430, 1090, 478, 1165], 'E'],
      ['216', 'Information Technology', 'r', [512, 1225, 590, 1328], 'N'],
      ['', 'Library Administration', 'b', [350, 597, 475, 805], 'E'],
      ['', 'Restrooms', 'w', [610, 615, 725, 655], 'S'],
      ['', 'Restrooms', 'w', [612, 1250, 745, 1335], 'N'],
      ['', 'North-west stairs', 's:NW', [430, 400, 500, 460], 'E'],
      ['', 'North-east stairs', 's:NE', [785, 600, 855, 670], 'W'],
      ['', 'Library spiral stair', 's:SC', [588, 612, 608, 668], 'S'],
      ['', 'South-west stairs', 's:SW', [512, 1180, 590, 1222], 'E'],
      ['', 'South-east stairs', 's:SE', [775, 1175, 855, 1222], 'W'],
      ['', 'Central elevators', 'e:EC', [548, 610, 585, 665], 'S'],
      ['', 'South elevator', 'e:ES', [665, 1180, 705, 1222], 'N'],
    ],
    walks: [
      [[488, 430], [488, 680], [488, 1175]],
      [[488, 1175], [750, 1175], [890, 1175]],
      [[750, 400], [750, 680], [750, 1175], [750, 1450]],
      [[488, 680], [750, 680]],
    ],
  },
  {
    level: 3,
    slabs: [
      [330, 390, 865, 930],
      [405, 930, 865, 1180],
      [480, 1180, 865, 1360],
      [560, 1360, 865, 1490],
    ],
    rooms: [
      ['307', 'Law Library Stacks', 'o', [490, 600, 736, 1175], 'W', 9195],
      ['300', "Dean's Suite", 'r', [338, 403, 586, 540], 'S'],
      ['304', 'Academic Operations', 'r', [586, 403, 736, 530], 'S', 482],
      ['306', 'Communications & Web Services', 'r', [736, 403, 865, 540], 'S', 436],
      ['303', 'Facilities & Supplies', 'r', [490, 552, 612, 643], 'N', 654],
      ['305', 'Mailroom', 'r', [612, 552, 634, 643], 'N', 108],
      ['307C', 'Study Room', 'r', [634, 552, 668, 592], 'N', 70],
      ['307B', 'Study Room', 'r', [668, 552, 702, 592], 'N', 70],
      ['307A', 'Study Room', 'r', [702, 552, 736, 592], 'N', 68],
      ['301', 'Student Lounge', 'r', [338, 790, 460, 930], 'E', 1194],
      ['313', 'Events Office', 'r', [740, 815, 790, 925], 'E', 355],
      ['', 'Faculty & Adjunct Offices', 'r', [810, 792, 865, 1230], 'W', undefined, 'Faculty'],
      ['326', 'Continuing Legal Education', 'r', [756, 1232, 865, 1365], 'W', 1035],
      ['330', 'Development & Alumni Relations', 'r', [716, 1391, 865, 1490], 'N', 837],
      ['336', 'Graduate & International Programs', 'r', [575, 1391, 716, 1490], 'N'],
      ['338', 'Graduate & International Programs', 'r', [490, 1280, 575, 1362], 'E', 357],
      ['', 'Equipment', 'b', [338, 561, 385, 775], 'E'],
      ['', 'Equipment', 'b', [767, 561, 865, 638], 'W'],
      ['', 'Offices', 'b', [740, 935, 790, 1180], 'E'],
      ['', 'Telecom', 'b', [592, 1201, 689, 1278], 'N'],
      ['', 'Restrooms', 'w', [595, 1280, 736, 1371], 'E'],
      ['', 'North-west stairs', 's:NW', [388, 637, 459, 713], 'E'],
      ['', 'North-east stairs', 's:NE', [767, 640, 835, 713], 'W'],
      ['', 'Library spiral stair', 's:SC', [564, 645, 614, 719], 'S'],
      ['', 'South-west stairs', 's:SW', [496, 1205, 575, 1258], 'N'],
      ['', 'South-east stairs', 's:SE', [760, 1185, 808, 1228], 'W'],
      ['', 'Central elevators', 'e:EC', [530, 650, 564, 700], 'S'],
      ['', 'South elevator', 'e:ES', [690, 1240, 722, 1278], 'N'],
    ],
    walks: [
      [[470, 548], [750, 548]],
      [[470, 548], [470, 730], [470, 1190]],
      [[750, 548], [750, 780], [800, 780], [800, 1200]],
      [[470, 1190], [740, 1190], [800, 1200]],
      [[470, 730], [620, 730]],
      [[740, 1190], [740, 1380], [585, 1380], [585, 1270]],
    ],
  },
  {
    level: 4,
    slabs: [
      [360, 375, 845, 862],
      [465, 862, 845, 1300],
      [580, 1300, 845, 1385],
    ],
    rooms: [
      ['433', 'Student Lounge', 'o', [669, 1320, 845, 1470], 'N', 1788],
      ['', 'Lyon Lab', 'r', [470, 778, 552, 940], 'E', undefined, 'Lyon Lab'],
      ['', 'Law Review', 'r', [466, 530, 547, 575], 'W', undefined, 'Law Review'],
      ['', 'Legal Writing Instruction', 'r', [628, 485, 690, 560], 'N', undefined, 'Writing'],
      ['431', "Dean's Conference Room", 'r', [591, 1297, 669, 1420], 'W', 394],
      ['', 'Faculty offices', 'b', [360, 375, 845, 450], 'S'],
      ['', 'Faculty offices', 'b', [360, 465, 440, 770], 'E'],
      ['', 'Faculty offices', 'b', [762, 465, 845, 770], 'W'],
      ['', 'Faculty offices', 'b', [360, 778, 465, 862], 'N'],
      ['', 'Faculty offices', 'b', [573, 778, 735, 862], 'N'],
      ['', 'Faculty offices', 'b', [762, 778, 845, 862], 'N'],
      ['', 'Faculty offices', 'b', [479, 963, 577, 1236], 'E'],
      ['', 'Faculty offices', 'b', [780, 900, 845, 1236], 'W'],
      ['', 'Offices', 'b', [594, 963, 754, 1031], 'W'],
      ['', 'Kitchen', 'b', [594, 1226, 666, 1294], 'W'],
      ['', 'Restrooms', 'w', [630, 568, 735, 660], 'E'],
      ['', 'Restrooms', 'w', [597, 1060, 754, 1203], 'W'],
      ['', 'North-west stairs', 's:NW', [385, 580, 430, 655], 'E'],
      ['', 'North-east stairs', 's:NE', [765, 580, 815, 635], 'W'],
      ['', 'South-west stairs', 's:SW', [483, 1240, 568, 1288], 'E'],
      ['', 'South-east stairs', 's:SE', [790, 1240, 845, 1288], 'W'],
      ['', 'Central elevators', 'e:EC', [505, 660, 545, 705], 'W'],
      ['', 'South elevator', 'e:ES', [708, 1250, 745, 1293], 'E'],
    ],
    walks: [
      [[452, 458], [752, 458], [752, 772], [452, 772], [452, 458]],
      [[452, 772], [562, 772], [562, 862], [585, 900], [585, 1360]],
      [[752, 772], [748, 862], [768, 900], [768, 1300]],
    ],
  },
]
