const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const app = express();

// Use MongoDB connection string from environment variables
const mongoURI = "mongodb+srv://pj912970:lFhoreymwFDJe068@sms.d8y3p.mongodb.net/?retryWrites=true&w=majority&appName=sms";

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.log('MongoDB connection error:', err));

// Define a schema for student data
const studentSchema = new mongoose.Schema({
  rno: Number,
  name: String,
  marks: Number,
  image: String, // This will store the file name/path
});

const Student = mongoose.model('Student', studentSchema);

// Middleware for CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Route to save student data
app.post("/ss", upload.single("file"), (req, res) => {
  const { rno, name, marks } = req.body;
  if (!rno || !name || !marks || !req.file) {
    return res.status(400).send({ error: "All fields are required." });
  }

  const newStudent = new Student({
    rno: rno,
    name: name,
    marks: marks,
    image: req.file.filename, // Store image filename
  });

  newStudent.save()
    .then((result) => res.send({ message: "Record created successfully", result }))
    .catch((err) => {
      console.error("Database Error:", err);
      res.status(500).send({ error: "Database Error", details: err });
    });
});

// GET route to fetch all student data
app.get("/gs", (req, res) => {
  Student.find()
    .then((students) => {
      res.json(students);  // Send all student records as JSON
    })
    .catch((err) => {
      console.error("Error fetching students:", err);
      res.status(500).send({ error: "Failed to fetch student data", details: err });
    });
});

// DELETE route to remove student and image
app.delete("/ds", (req, res) => {
  const { rno, image } = req.body;

  if (!rno || !image) {
    return res.status(400).send({ error: "Student roll number and image are required." });
  }

  // Delete student by roll number
  Student.findOneAndDelete({ rno })
    .then((deletedStudent) => {
      if (!deletedStudent) {
        return res.status(404).send({ error: "Student not found." });
      }

      // Delete the image file from the server
      const imagePath = path.join(__dirname, 'uploads', image);
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Error deleting image:", err);
          return res.status(500).send({ error: "Error deleting image." });
        }

        res.send({ message: "Record and image deleted successfully." });
      });
    })
    .catch((err) => {
      console.error("Error deleting student:", err);
      res.status(500).send({ error: "Failed to delete student.", details: err });
    });
});

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
app.listen(9000, () => console.log("Server running at http://localhost:9000"));
