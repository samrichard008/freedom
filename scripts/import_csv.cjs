const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'raw_updates.csv');
const rawCsv = fs.readFileSync(csvPath, 'utf8');

const lines = rawCsv.trim().split('\n');
const parsed = [];

for (let line of lines) {
  if (!line.trim()) continue;
  if (line.startsWith('ID,Full Name')) continue;

  // CSV parsing handling quotes
  const row = [];
  let inQuotes = false;
  let token = '';

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        token += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(token);
      token = '';
    } else {
      token += c;
    }
  }
  row.push(token);

  if (row.length >= 6) {
    parsed.push({
      id: row[0].trim(),
      fullName: row[1].trim(),
      nic: row[2].trim(),
      phone: row[3].trim(),
      district: row[4].trim(),
      createdAt: row[5].trim(),
      comment: (row[6] || '').trim(),
      verified: true
    });
  }
}

console.log('Parsed total signatures:', parsed.length);

// Sort by date descending
parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const tsFile = `import { Signature } from '../types';

export const INITIAL_30_SIGNATURES: Signature[] = ${JSON.stringify(parsed, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, '../src/data/initialSignatures.ts'), tsFile, 'utf8');
fs.writeFileSync(path.join(__dirname, '../public/gnanasara_petition_backup.json'), JSON.stringify(parsed, null, 2), 'utf8');

const headers = ['ID', 'Full Name', 'NIC', 'Phone', 'District', 'Date', 'Comment'];
const rows = parsed.map(s => [
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

console.log('Successfully written initialSignatures.ts and public CSV/JSON backups!');
