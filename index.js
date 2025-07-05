import express from "express";
import cors from "cors";
import { createWorker } from "tesseract.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// configure multer for file uploads
const upload = multer({ dest: "uploads/" });

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

app.post("/ocr", upload.single("image"), async (req, res) => {
  let imageUrl;

  try {
    if (req.body.file_id) {
      // 1. get file from Telegram
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${req.body.file_id}`);
      const data = await response.json();
      if (!data.ok) throw new Error("getFile failed");

      const filePath = data.result.file_path;
      imageUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;
    } else if (req.file) {
      // file was uploaded
      imageUrl = path.resolve(req.file.path);
    } else {
      return res.status(400).json({ error: "No file_id or file uploaded" });
    }

    const worker = await createWorker("ind");
    const result = await worker.recognize(imageUrl);
    await worker.terminate();

    // optionally delete uploaded file after OCR
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.json({ text: result.data.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OCR failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`OCR server running on port ${PORT}`));

