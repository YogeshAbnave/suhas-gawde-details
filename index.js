const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');

const app = express();
const PORT = 5000;

const corsOptions = {
  origin: 'http://localhost:3000',
  credentials: true,
};

app.use(cors(corsOptions));
// app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'dist')));
// MongoDB connection
mongoose.connect('mongodb+srv://JLPT-EXAM:Fl4xkzwe7FhJ5fMY@cluster0.bi0xw4z.mongodb.net/JLPT-EXAM', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const photoSchema = new mongoose.Schema({
  id: String,
  url: String,
});

const Photo = mongoose.model('Photo', photoSchema);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueId = nanoid;
    const filename = `${file.originalname}`;
    cb(null, filename);
  },
});

const upload = multer({ storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const filePath = path.join('uploads', file.filename);
    const fileUrl = `${req.protocol}://${req.get('host')}/${filePath}`;

    // Save file data to MongoDB
    const newPhoto = new Photo({ id: file.filename, url: fileUrl });
    await newPhoto.save();

    res.json({ id: file.filename, url: fileUrl });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      res.status(400).json({ error: 'Duplicate key error' });
    } else {
      console.error('Error saving file data to MongoDB: ', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

app.get('/photos', async (req, res) => {
  try {
    // Retrieve photos from MongoDB
    const photos = await Photo.find({}, 'id url');
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos from MongoDB: ', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`index is running on port ${PORT}`);
});
