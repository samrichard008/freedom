const fs = require('fs');
const https = require('https');

const STORAGE_ZONE = 'gnanasara-petition';
const ACCESS_KEY = 'e09085cd-4065-4aa7-a543641e2577-a063-4a05';
const ENDPOINT = 'sg.storage.bunnycdn.com';

async function uploadFile(localPath, remoteName) {
  return new Promise((resolve, reject) => {
    const fileContent = fs.readFileSync(localPath);
    const options = {
      hostname: ENDPOINT,
      path: `/${STORAGE_ZONE}/${remoteName}`,
      method: 'PUT',
      headers: {
        'AccessKey': ACCESS_KEY,
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileContent.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(fileContent);
    req.end();
  });
}

async function run() {
  try {
    console.log('Uploading 29,201 signatures database to Bunny.net storage...');
    await uploadFile('./public/gnanasara_petition_backup.json', 'signatures_db.json');
    console.log('Success! signatures_db.json uploaded to Bunny.net!');
  } catch (err) {
    console.error('Error uploading:', err.message);
  }
}

run();
