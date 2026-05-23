const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '3dxUyKVUALEyjUc.root',
  password: '8RtVWFsKT0nkphaF',
  database: 'test',
  ssl: {
    rejectUnauthorized: false
  }
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to TiDB:', err.stack);
    return;
  }
  console.log('Connected successfully to TiDB as id ' + connection.threadId);
  connection.query('SELECT 1 + 1 AS solution', (error, results) => {
    if (error) {
      console.error('Error running query:', error);
    } else {
      console.log('Query result:', results[0].solution);
    }
    connection.end();
  });
});
