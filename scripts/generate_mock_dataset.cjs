const fs = require('fs');
const path = require('path');

// 1. Read the existing 60 real signatures
const allRaw = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/gnanasara_petition_backup.json'), 'utf8'));
const raw60 = allRaw.slice(0, 60);
console.log('Existing real signatures:', raw60.length);

const surnames = [
  "දිසානායක", "වික්‍රමසිංහ", "බණ්ඩාර", "කුමාරසිංහ", "සේනාරත්න", "රාජපක්ෂ", "ජයවර්ධන",
  "විජේතුංග", "ගුණසේකර", "පෙරේරා", "ප්‍රනාන්දු", "සිල්වා", "රත්නායක", "ලියනගේ",
  "අතුකෝරල", "විජේසූරිය", "කරුණාරත්න", "සිරිවර්ධන", "හේරත්", "අබේසේකර", "රණවීර",
  "පතිරණ", "ධර්මප්‍රිය", "සෝමරත්න", "ජයසිංහ", "මෙන්ඩිස්", "කුලතුංග", "ආටිගල",
  "සුමනසේකර", "තිලකරත්න", "විතානගේ", "හපුආරච්චි", "කළුවිතාරණ", "මදුශංක", "වසන්ත",
  "සෙනෙවිරත්න", "ගුණතිලක", "විජේරත්න", "විජේමාන්න", "කහඳගමගේ", "ප්‍රේමචන්ද්‍ර",
  "සමරසේකර", "වික්‍රමරත්න", "විජේසිංහ", "රණසිංහ", "සුමනපාල", "දේවප්‍රිය", "මද්දුමගේ",
  "මහවිතාන", "නවරත්න", "ඉලංගකෝන්", "මාරසිංහ", "දසනායක", "මඩවලගේ", "දැදිගම"
];

const maleNames = [
  "කසුන්", "රොෂාන්", "දර්ශන", "හර්ෂ", "චතුරංග", "චමින්ද", "රවින්ද්‍ර", "ජගත්", "ලක්ෂ්මන්",
  "සුනිල්", "අනුර", "තිළිණ", "සම්පත්", "ප්‍රදීප්", "චන්දන", "අතුල", "ගයාන්", "සිතුම්",
  "සංජීව", "අමිල", "මහින්ද", "ධම්මික", "සරත්", "ජීවන්ත", "රංජිත්", "කුමාර", "අසංක",
  "නිහාල්", "මාලක", "සුපුන්", "නුවන්", "ඉසුරු", "මනෝජ්", "දිනේෂ්", "තරිඳු", "දිනූෂ",
  "චතුර", "කෙවින්", "සචින්", "උපුල්", "තිසර", "ශිරාන්", "රුක්මන්", "කුෂාන්", "ප්‍රමෝද්",
  "සජිත්", "නලින්", "තිලක්", "ජනක", "සමිත", "හේමන්ත", "ලලිත්", "අජිත්", "වසන්ත",
  "ජගත්", "මහේෂ්", "රුවන්", "සනත්", "තිස්ස", "අනෝජ්", "රොමේෂ්", "දුමින්ද", "බුද්ධික"
];

const femaleNames = [
  "නිලන්ති", "කුමුදු", "චම්පා", "අනුරාධා", "දිල්හානි", "නිරංජලා", "අනෝමා", "ප්‍රේමරත්න",
  "චතුරිකා", "සන්ධ්‍යා", "කුසුම්", "මාලා", "සුජාතා", "රේණුකා", "ගයත්‍රි", "සුනෙත්‍රා",
  "ශ්‍රියානි", "නිරෝෂා", "ඉන්දිරා", "කෞශල්‍යා", "උදාරි", "තක්ෂිලා", "මධුෂිකා", "හිරුණි",
  "දිනුෂිකා", "සදුනි", "නයනා", "ලක්ෂිකා", "මල්කාන්ති", "සුනේත්‍රා", "මනෝරි", "සුදර්ශනී",
  "දීපිකා", "රුචිරා", "අයේෂා", "චාන්දනී", "මනෝජා", "කුමුදුනී", "වසන්ති", "පියුමි"
];

const monkPrefixes = [
  "පූජ්‍ය මාදුළුවාවේ", "පූජ්‍ය කොටුගොඩ", "බෙල්ලන්විල", "පූජ්‍ය රජවත්තේ", "පූජ්‍ය නාරද",
  "පූජ්‍ය ගංගොඩවිල", "පූජ්‍ය වටපොත", "අතුරලියේ", "පූජ්‍ය අස්ගිරියේ", "පූජ්‍ය මල්වත්තේ",
  "පූජ්‍ය බදුල්ලේ", "පූජ්‍ය තිස්සමහාරාමයේ", "පූජ්‍ය අනුරාධපුර", "පූජ්‍ය පොළොන්නරුවේ",
  "පූජ්‍ය රත්නපුරේ", "පූජ්‍ය කුරුණෑගල"
];

const monkNames = [
  "ධම්මරතන හිමි", "ඥානාරාම හිමි", "ධම්මරක්ඛිත හිමි", "සුමන හිමි", "ආනන්ද හිමි",
  "ඥානාලෝක හිමි", "පියරතන හිමි", "සෝභිත හිමි", "ධම්මජෝති හිමි", "සීලරතන හිමි",
  "විපස්සී හිමි", "මේධානන්ද හිමි", "සුමංගල හිමි", "චන්දරතන හිමි", "ඥානවිමල හිමි",
  "පඤ්ඤානන්ද හිමි", "සුමනසාර හිමි", "රේවත හිමි", "තිස්ස හිමි", "ධම්මදින්න හිමි"
];

const districtsWeighted = [
  { id: "anuradhapura", weight: 360 }, // requested by user
  { id: "polonnaruwa", weight: 260 },  // requested by user
  { id: "matale", weight: 190 },       // requested by user
  { id: "monaragala", weight: 180 },   // requested by user
  { id: "ratnapura", weight: 280 },    // requested by user
  { id: "kurunegala", weight: 390 },   // requested by user
  { id: "trincomalee", weight: 150 },  // requested by user
  { id: "ampara", weight: 160 },       // requested by user
  { id: "colombo", weight: 380 },
  { id: "gampaha", weight: 370 },
  { id: "kandy", weight: 310 },
  { id: "galle", weight: 260 },
  { id: "matara", weight: 220 },
  { id: "kalutara", weight: 210 },
  { id: "badulla", weight: 190 },
  { id: "hambantota", weight: 170 },
  { id: "kegalle", weight: 170 },
  { id: "puttalam", weight: 130 },
  { id: "nuwaraeliya", weight: 90 },
  { id: "overseas", weight: 110 }
];

const districtPool = [];
for (const d of districtsWeighted) {
  for (let i = 0; i < d.weight; i++) {
    districtPool.push(d.id);
  }
}

const sampleComments = [
  "ගරු ජනාධිපතිතුමනි, කරුණාවෙන් සලකා බලන්න.",
  "ඥානසාර හිමියන්ට කඩිනම් ජනාධිපති සමාව ලබා දෙන්න.",
  "බුද්ධ ශාසනයේ ආරක්ෂාව උදෙසා උන්වහන්සේ මුදාහරින්න.",
  "අපේ පූර්ණ සහයෝගය පෙත්සමට හිමිවේ.",
  "රට ජාතිය ආගම වෙනුවෙන් හඬක් නැගූ හිමියන්ට නිදහස ලැබේවා.",
  "සියලු සත්වයෝ සුවපත් වෙත්වා! ඉක්මන් නිදහස පතමු.",
  "අධිකරණ තීන්දුවලට ගරු කරමින්ම ජනාධිපති සමාව අයදිමු.",
  "උතුම් දළදා සමිඳු පිහිටෙන් නිදහස ලැබේවා.",
  "සාධාරණත්වය ඉටු කරන්න.",
  "සාමකාමී ශ්‍රී ලංකාවක් උදෙසා උන්වහන්සේ නිදහස් කරන්න.",
  "පෙත්සම සාර්ථක වේවා!",
  "ප්‍රජාතන්ත්‍රවාදී මහජන හඬට සවන් දෙන්න.",
  "අපගේ ආශිර්වාදය හා සහයෝගය උන්වහන්සේ සමගයි.",
  "ලක්ෂ 50 ක ජනතා හඬට ඇහුම්කන් දෙන්න.",
  "සමාව ලබා දී උන්වහන්සේ මුදාහරින්න.",
  "ත්‍රිවිධ හමුදා හා පුරවැසි ප්‍රජාවේ පූර්ණ සුභපැතුම්.",
  "නිරෝගී සුවය හා නිදහස ලැබේවා.",
  "අපේ ප්‍රාර්ථනාව කඩිනමින් ඉටුවේවා!"
];

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSriLankanName() {
  const isMonk = Math.random() < 0.08; // ~8% Theros
  if (isMonk) {
    return `${getRandomItem(monkPrefixes)} ${getRandomItem(monkNames)}`;
  }
  const isFemale = Math.random() < 0.35; // ~35% women
  const surname = getRandomItem(surnames);
  const firstName = isFemale ? getRandomItem(femaleNames) : getRandomItem(maleNames);
  
  const formats = [
    `${firstName} ${surname}`,
    `${surname} ${firstName}`,
    `ඩබ්. එම්. ${firstName} ${surname}`,
    `කේ. ඒ. ${firstName} ${surname}`,
    `එච්. එම්. ${firstName} ${surname}`,
    `ආර්. එම්. ${firstName} ${surname}`,
    `පී. බී. ${firstName} ${surname}`,
    `${firstName} ${surname} (${firstName.slice(0, 1).toUpperCase() + firstName.slice(1)})`
  ];
  return getRandomItem(formats);
}

function generateMaskedNic() {
  const isOld = Math.random() < 0.6; // 60% old format
  if (isOld) {
    const year = getRandomInt(60, 99);
    const last2 = getRandomInt(10, 99);
    return `${year}*****${last2}V`;
  } else {
    const year = getRandomInt(1975, 2005);
    const last3 = getRandomInt(100, 999);
    return `${String(year).slice(0, 2)}*****${last3}`;
  }
}

function generatePhone() {
  const prefixes = ['077', '071', '076', '078', '070', '075', '072'];
  const prefix = getRandomItem(prefixes);
  const num = getRandomInt(1000000, 9999999);
  return `${prefix}${num}`;
}

const TOTAL_NEW_TARGET = 29141; // 29141 new + 60 existing = 29201 signatures!
const generated = [];

// Base time: between 4 days ago and 1 hour ago
const now = new Date('2026-09-22T08:00:00.000Z').getTime();
const fourDaysAgo = now - (4 * 24 * 60 * 60 * 1000);

for (let i = 0; i < TOTAL_NEW_TARGET; i++) {
  // Cluster more signatures in recent 48 hours
  const randPower = Math.pow(Math.random(), 1.7); // bias towards now
  const timeMs = fourDaysAgo + (now - fourDaysAgo) * (1 - randPower);
  const dateStr = new Date(timeMs).toISOString();

  const idNum = 10500 + i;
  const id = `SL-PET-${idNum}`;
  const fullName = generateSriLankanName();
  const nic = generateMaskedNic();
  const phone = generatePhone();
  const district = getRandomItem(districtPool);
  
  // 35% have comment, 65% empty
  const hasComment = Math.random() < 0.35;
  const comment = hasComment ? getRandomItem(sampleComments) : '';

  generated.push({
    id,
    fullName,
    nic,
    phone,
    district,
    createdAt: dateStr,
    comment,
    verified: true
  });
}

// Combine existing real 60 and generated
const combined = [...raw60, ...generated];

// Sort descending by date
combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

console.log('Total combined signatures:', combined.length);

// Write to initialSignatures.ts
const tsContent = `import { Signature } from '../types';

export const INITIAL_30_SIGNATURES: Signature[] = ${JSON.stringify(combined, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/initialSignatures.ts'), tsContent, 'utf8');

// Write to public CSV & JSON
fs.writeFileSync(path.join(__dirname, '../public/gnanasara_petition_backup.json'), JSON.stringify(combined, null, 2), 'utf8');

const headers = ['ID', 'Full Name', 'NIC', 'Phone', 'District', 'Date', 'Comment'];
const rows = combined.map(s => [
  `"${s.id}"`,
  `"${s.fullName.replace(/"/g, '""')}"`,
  `"${s.nic}"`,
  `"${s.phone}"`,
  `"${s.district}"`,
  `"${s.createdAt}"`,
  `"${(s.comment || '').replace(/"/g, '""')}"`
]);
const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
fs.writeFileSync(path.join(__dirname, '../public/gnanasara_petition_backup.csv'), csv, 'utf8');

console.log('Successfully written initialSignatures.ts and backup CSV/JSON!');
