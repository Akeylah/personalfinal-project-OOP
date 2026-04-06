const { Pool } = require("pg");

const pool = new Pool({
 user: "postgres",
  host: "localhost",
  database: "restaurant_OOP",
  password: "akeylah", 
  port: 5432
});

module.exports = pool;
