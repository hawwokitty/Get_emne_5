// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sql = require("mssql");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MS SQL database connection configuration
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    trustServerCertificate: true,
    enableArithAbort: true,
  },
};

// Connect to the MS SQL database
sql.connect(dbConfig)
  .then((pool) => {
    if (pool.connected) console.log("Connected to MS SQL Database");
  })
  .catch((err) => console.error("Database connection failed", err));

// Define routes
app.get("/api/users/:id/countries_visited", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql.query(
      `SELECT * FROM countries_visited WHERE user_id = ${id}`
    );
    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving visited countries");
  }
});

app.post("/api/users/:id/countries_visited", async (req, res) => {
  const { id } = req.params;
  const { country_id } = req.body;
  try {
    const result = await sql.query(
      `INSERT INTO countries_visited (user_id, country_id) VALUES (${id}, ${country_id})`
    );
    res.status(201).send("Country added to visited list");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding visited country");
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
