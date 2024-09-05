// backend/server.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const sql = require("mssql");
const bcrypt = require('bcrypt');
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

// Define routes for Map page
// GET users visited countries
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

// POST users visited country to database
app.post("/api/users/:id/countries_visited", async (req, res) => {
  const { id } = req.params;
  const { country_id } = req.body;
  try {
    const result = await sql.query(
      `INSERT INTO countries_visited (user_id, country_id) VALUES (${id}, ${country_id})`
    );
    res.status(201).json({ message: "Country added to visited list" }); // Return JSON response
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding visited country" }); // Return JSON response
  }
});

// DELETE users visited country from database
app.delete("/api/users/:id/countries_visited", async (req, res) => {
  const { id } = req.params;
  const { country_id } = req.body;
  try {
    const result = await sql.query(
      `DELETE FROM countries_visited WHERE user_id = ${id} AND country_id = ${country_id}`
    );
    
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Country not found in visited list" }); // Return JSON response
    } else {
      res.status(200).json({ message: "Country removed from visited list" }); // Return JSON response
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error removing visited country" }); // Return JSON response
  }
});

// Signup and login with help from chat gpt <3

app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const hash = await bcrypt.hash(password, 10);

    // Create a new request instance
    const pool = await sql.connect(); // Connect to the pool
    const request = pool.request();

    // Define the input parameters
    request.input("Email", sql.VarChar, email); 
    request.input("Hash", sql.VarChar, hash);  

    // Execute the query
    const result = await request.query(
      `INSERT INTO users (email, password_hash) VALUES (@Email, @Hash)`
    );

    res.status(201).json({ message: "User added to database" });
  } catch (err) {
    console.error("Error adding user:", err);
    res.status(500).json({ error: "Error adding user", err });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Basic input validation
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Log the beginning of the login process
    console.log(`Attempting to log in user with email: ${email}`);

    // Create a new SQL request using the connection pool
    const pool = await sql.connect(); // Connect to the database pool if not already connected
    const request = pool.request(); // Create a new request object

    // Add the email parameter to the request
    request.input('Email', sql.VarChar, email); // Bind the email parameter

    // Execute the query with the bound parameter
    const result = await request.query(
      `SELECT * FROM users WHERE email = @Email`
    );

    // Log the SQL query result
    console.log("Database query result:", result);

    // Check if a user with the provided email was found
    if (result.recordset.length === 0) {
      console.log("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.recordset[0]; // Get the first record (user)

    // Log the retrieved user information (excluding sensitive data)
    console.log(`User found: ${user.email}`);

    // Compare the provided password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    // Log the password comparison result
    console.log(`Password match status: ${isPasswordMatch}`);

    if (!isPasswordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Successful login
    res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        // Return additional user fields if needed, but avoid sensitive info
      },
    });
  } catch (err) {
    // Log the error details for better debugging
    console.error("Error during login process:", err);
    res.status(500).json({ error: "Error during login process" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
