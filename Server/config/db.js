const {Pool} = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function getUsers() {
  try {
    const res = await pool.query("SELECT * FROM users");
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Error querying database:", err);
  }
}

getUsers();
module.exports ={ pool };
