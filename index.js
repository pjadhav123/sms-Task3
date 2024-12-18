const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "abc123",
  database: "sms18dec24",
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder for uploads
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});
const upload = multer({ storage });

app.use("/uploads", express.static("uploads"));

app.post("/ss", upload.single("file"), (req, res) => {
  if (!req.file || !req.body.rno || !req.body.name || !req.body.marks) {
    return res.status(400).send("All fields are required.");
  }
  let data = [req.body.rno, req.body.name, req.body.marks, req.file.filename];
  let sql = "INSERT INTO student (rno, name, marks, image) VALUES (?, ?, ?, ?)";
  con.query(sql, data, (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/gs", (req, res) => {
  let sql = "SELECT * FROM student";
  con.query(sql, (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

// Delete Student (DELETE /ds)
app.delete("/ds", (req, res) => {
  if (!req.body.rno || !req.body.image) {
    return res.status(400).send("Rno and image are required.");
  }
  fs.unlink("./uploads/" + req.body.image, (err) => {
    if (err) {
      console.error("Error deleting file:", err);
    }
  });
  let data = [req.body.rno];
  let sql = "DELETE FROM student WHERE rno = ?";
  con.query(sql, data, (err, result) => {
    if (err) {
      console.error("Database Error:", err);
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

// Start server
app.listen(9000, () => {
  console.log("Server is ready at http://localhost:9000");
});
