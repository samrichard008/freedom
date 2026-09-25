const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL or POSTGRES_URL environment variable is missing.');
    process.exit(1);
  }

  console.log('🔄 Connecting to PostgreSQL database...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Ensuring signatures table exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS signatures (
        id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        nic VARCHAR(50) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        district VARCHAR(100) NOT NULL,
        comment TEXT,
        signature_data_url TEXT,
        created_at VARCHAR(50) NOT NULL,
        verified BOOLEAN DEFAULT TRUE
      );
    `);
    console.log('✅ Signatures table verified.');

    const backupPath = path.join(__dirname, '..', 'public', 'gnanasara_petition_backup.json');
    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Error: Backup file not found at ${backupPath}`);
      process.exit(1);
    }

    console.log('🔄 Reading local backup file...');
    const rawData = fs.readFileSync(backupPath, 'utf8');
    const allSignatures = JSON.parse(rawData);
    console.log(`📋 Found ${allSignatures.length} signatures in local backup file.`);

    console.log('🚀 Starting batch insert to PostgreSQL...');
    let insertedCount = 0;
    let duplicateCount = 0;

    // We insert in batches to be fast
    const batchSize = 1000;
    for (let i = 0; i < allSignatures.length; i += batchSize) {
      const batch = allSignatures.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${i / batchSize + 1} (${i} to ${Math.min(i + batchSize, allSignatures.length)})...`);

      // We do it sequentially or in parallel chunks
      await Promise.all(batch.map(async (sig) => {
        if (!sig.nic) return;
        try {
          const res = await client.query(
            `INSERT INTO signatures (id, full_name, nic, phone, district, comment, signature_data_url, created_at, verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (nic) DO NOTHING`,
            [
              sig.id,
              sig.fullName,
              sig.nic.trim().toUpperCase(),
              sig.phone || '',
              sig.district || '',
              sig.comment || '',
              sig.signatureDataUrl || '',
              sig.createdAt || new Date().toISOString(),
              sig.verified !== false
            ]
          );
          if (res.rowCount && res.rowCount > 0) {
            insertedCount++;
          } else {
            duplicateCount++;
          }
        } catch (err) {
          // Log errors only if they are not typical duplicate key violations
          if (err.code !== '23505') {
            console.error(`❌ Row insert failed for ${sig.id}:`, err.message);
          } else {
            duplicateCount++;
          }
        }
      }));
    }

    console.log(`\n🎉 Seeding Completed successfully!`);
    console.log(`✅ Newly Migrated & Inserted: ${insertedCount}`);
    console.log(`⏭️ Duplicates Skipped / Already Exist: ${duplicateCount}`);
    console.log(`📊 Total Processed: ${allSignatures.length}`);

  } catch (err) {
    console.error('❌ Critical Error during seeding:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
