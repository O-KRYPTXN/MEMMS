const { Client } = require('pg');

async function check() {
  const client = new Client({ connectionString: 'postgresql://postgres:asdfasdf@localhost:5432/memms_db' });
  await client.connect();
  await client.query("UPDATE \"User\" SET phone='01000000000' WHERE role='TECHNICIAN' AND email='tech1@memms.local'");
  await client.query("UPDATE \"User\" SET phone='01111111111' WHERE role='TECHNICIAN' AND email='tech2@memms.local'");
  console.log('Phone numbers updated for technicians.');
  await client.end();
}
check();
