const express = require("express");
const sql = require("mssql");

const app = express();
app.use(express.json());

const config = {
  user: "sa",
  password: "passord123",
  server: "HSA001/SQLEXPRESS2",
  database: "expressxnode",
  options: {
    trustServerCertificate: true,
    connectionTimeout: 30000, // Optional: Increase timeout
  },
};

sql.connect(config, (err) => {
  if (err) console.error(err);
  else console.log("Connected to the database.");
});


// API-endepunkter fra løsningsforslaget:

// GET /api/users
app.get("/api/users", async (req, res) => {
  try {
    const result = await sql.query("SELECT * FROM users");
		res.json(result.recordset);
	} catch (err) {
    res.status(500).send(err.message);
	}
});

// GET /api/users/:id
app.get("/api/users/:id", async (req, res) => {
  const { id } = req.params;
	try {
    const result = await sql.query`SELECT * FROM users WHERE ID = ${id}`;
		if (result.recordset.length > 0) {
      res.json(result.recordset[0]);
		} else {
      res.status(404).send("User not found");
		}
	} catch (err) {
    res.status(500).send(err.message);
	}
});

// POST /api/users
app.post("/api/users", async (req, res) => {
  const { EMAIL, NAME, AGE } = req.body;
	try {
    const result = await sql.query`INSERT INTO users (EMAIL, NAME, AGE) VALUES (${EMAIL}, ${NAME}, ${AGE})`;
		res.status(201).send("User created");
	} catch (err) {
    res.status(500).send(err.message);
	}
});

// PUT /api/users/:id
app.put("/api/users/:id", async (req, res) => {
  const { id } = req.params;
	const { EMAIL, NAME, AGE } = req.body;
	try {
    const result = await sql.query`UPDATE users SET EMAIL = ${EMAIL}, NAME = ${NAME}, AGE = ${AGE} WHERE ID = ${id}`;
		if (result.rowsAffected[0] > 0) {
      res.send("User updated");
		} else {
      res.status(404).send("User not found");
		}
	} catch (err) {
    res.status(500).send(err.message);
	}
});

// DELETE /api/users/:id
app.delete("/api/users/:id", async (req, res) => {
  const { id } = req.params;
	try {
    const result = await sql.query`DELETE FROM users WHERE ID = ${id}`;
		if (result.rowsAffected[0] > 0) {
      res.send("User deleted");
		} else {
      res.status(404).send("User not found");
		}
	} catch (err) {
    res.status(500).send(err.message);
	}
});

const port = 3111;
app.listen(port, () => {
  console.log(`listening on port ${port}`);
});

module.exports = app;