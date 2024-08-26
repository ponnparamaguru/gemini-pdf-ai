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
  dest: '/tmp/uploads/', 
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB file size limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed.'));
    }
    cb(null, true);
  }
});

function formatResponse(text) {
  
  const sections = text.split(/\*\*(.+?)\*\*/);
  
  let formattedResponse = '';

  sections.forEach((section, index) => {
    if (index === 0) {
      
      formattedResponse += section.trim();
    } else {
      const [heading, ...contentParts] = section.split('\n');
      const headingText = heading.trim();
      const contentText = contentParts.join('\n').trim();
      
      formattedResponse += `\n\n**${headingText}**\n${contentText}`;
    }
  });
  formattedResponse = formattedResponse.replace(/\* /g, '\n* ');

  return formattedResponse;
}

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

app.post('/api/chat', upload.array('pdfs'), async (req, res) => {
  try {
    const files = req.files;
    const userMessage = req.body.message;
    let combinedText = '';

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files were uploaded.' });
    }

    for (const file of files) {
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
    const text = await response.text();

    const formattedText = formatResponse(text);

    res.json({ reply: formattedText });

  } catch (error) {
    console.error('Error in /api/chat endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing the request.' });
  }
});

module.exports = app;
