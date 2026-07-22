const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: 'postgresql://postgres:asdfasdf@localhost:5432/memms_db' });
  await client.connect();
  const res = await client.query('SELECT id, name, phone FROM "User" WHERE role=\'TECHNICIAN\'');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
check();
