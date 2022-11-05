const express = require("express");
const mysql = require("mysql");
const app = express();
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

app.use(express.json());

const ini = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
});

ini.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
  ini.query("CREATE DATABASE IF NOT EXISTS laurettaDB", function (err) {
    if (err) throw err;
  });
});

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

db.connect(function (err) {
  if (err) throw err;
  var createTable =
    "CREATE TABLE IF NOT EXISTS users (id BIGINT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255), password VARCHAR(255), location VARCHAR(2));";

  db.query(createTable, function (err) {
    if (err) throw err;
  });
});

const users = [];

app.get("/users", (res) => {
  db.query("SELECT * FROM users", function(err, result) {
    users.push(result)
  })
});

app.post("/users", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashPw = await bcrypt.hash(req.body.password, salt);
    console.log(salt);
    console.log(hashPw);
    db.query("INSERT INTO users SET ?", {username: req.body.username, password: hashPw, location: req.body.location})
    const user = { username: req.body.username, password: hashPw };
    users.push(user);
    res.status(200).send();
  } catch {
    res.status(500).send("Error logging in");
  }
});

app.post("/users/login", async (req, res) => {
  const user = users.find((user) => (user.username = req.body.username));
  console.log(users);
  const firstTwo = req.body.username.slice(0, 2);

  if (user == null) {
    return res.status(400).send("User not found");
  } else if (firstTwo.toLowerCase() !== req.body.location.toLowerCase()) {
    return res.status(500).send("Not a regional username");
  }

  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send("Success");
    } else {
      res.send("Error logging in");
    }
  } catch {
    res.status(500).send("Error logging in");
  }
});

app.listen(3001);
