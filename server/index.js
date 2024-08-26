const express = require('express');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const natural = require('natural');
const cors = require('cors');

dotenv.config();

const app = express();
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  }
});

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function isRelevant(prompt, pdfText) {
  const tokenizer = new natural.WordTokenizer();
  const promptWords = tokenizer.tokenize(prompt.toLowerCase());
  const pdfWords = tokenizer.tokenize(pdfText.toLowerCase());
  const pdfWordSet = new Set(pdfWords);
  const commonWords = promptWords.filter(word => pdfWordSet.has(word));
  const relevanceRatio = commonWords.length / promptWords.length;
  return relevanceRatio > 0.1; 
}

app.post('/chat', upload.array('pdfs'), async (req, res) => {
  try {
    const files = req.files;
    const userMessage = req.body.message;
    let combinedText = '';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    // Process each uploaded file
    for (const file of files) {
      if (!file.path) {
        console.error('File path is missing for file:', file);
        return res.status(400).json({ error: 'File path is missing' });
      }

      try {
        const dataBuffer = fs.readFileSync(file.path);
        const data = await pdf(dataBuffer);
        combinedText += data.text + '\n';

        fs.unlink(file.path, (err) => {
          if (err) {
            console.error(`Error deleting file ${file.path}:`, err);
          }
        });
      } catch (err) {
        console.error(`Error processing file ${file.originalname}:`, err);
        return res.status(500).json({ error: `Error processing file ${file.originalname}` });
      }
    }

    if (!isRelevant(userMessage, combinedText)) {
      return res.json({ reply: "It isn't relevant" });
    }

    const model = await genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `${userMessage}: ${combinedText}`;
    const result = await model.generateContent(prompt, { maxTokens: 100 });
    const response = await result.response;
    let text = await response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Error in /chat endpoint:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'An error occurred while processing the request.' });
    }
  }
});

app.listen(5000, () => {
  console.log('Server started on http://localhost:5000');
});
