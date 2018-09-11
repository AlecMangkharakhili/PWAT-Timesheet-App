var mysql = require('mysql');

// Initializes connection to database using environment variables
var connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });
  
  connection.connect((err) => {
    if(err){
      throw err;
    }
    console.log('Connection successful');
  });

module.exports = connection;