import express from "express";
import cors from "cors";
import { createWorker } from "tesseract.js";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

app.post("/ocr", async (req, res) => {
  const { file_id } = req.body;

  try {
    // 1. getFile
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${file_id}`);
    const data = await response.json();
    if (!data.ok) throw new Error("getFile failed");

    const filePath = data.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;

    // 2. OCR
    const worker = await createWorker("ind");
    const result = await worker.recognize(fileUrl);
    await worker.terminate();

    res.json({ text: result.data.text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "OCR failed" });
  }
});

app.listen(3000, () => console.log("OCR server running on http://localhost:3000"));
