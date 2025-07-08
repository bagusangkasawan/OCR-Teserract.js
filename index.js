//index.js
import express from "express";
import cors from "cors";
import { createWorker } from "tesseract.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { convert } from 'pdf-poppler';
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const N8N_CHAT_WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL;

/**
 * Memproses file PDF lokal, mengubahnya menjadi gambar, dan melakukan OCR.
 * @param {string} pdfPath - Path ke file PDF.
 * @param {Tesseract.Worker} worker - Instance Tesseract worker.
 * @returns {Promise<string>} Teks hasil OCR.
 */
async function processPdf(pdfPath, worker) {
    let ocrText = "";
    const tempImagePaths = [];
    const outputDir = path.dirname(pdfPath);
    const outPrefix = `${path.basename(pdfPath, path.extname(pdfPath))}_${Date.now()}`;

    try {
        const opts = {
            format: 'png',
            out_dir: outputDir,
            out_prefix: outPrefix,
            page: null
        };

        await convert(pdfPath, opts);

        const filesInDir = await fs.readdir(outputDir);
        const imageFiles = filesInDir.filter(f => f.startsWith(outPrefix) && f.endsWith('.png'));

        imageFiles.sort((a, b) => {
            const pageNumA = parseInt(a.match(/-(\d+)\.png$/)[1], 10);
            const pageNumB = parseInt(b.match(/-(\d+)\.png$/)[1], 10);
            return pageNumA - pageNumB;
        });

        for (const imageFile of imageFiles) {
            const imagePath = path.join(outputDir, imageFile);
            tempImagePaths.push(imagePath);
            const { data: { text } } = await worker.recognize(imagePath);
            ocrText += text + "\n\n--- Halaman Berikutnya ---\n\n";
        }
        return ocrText;
    } finally {
        for (const tempPath of tempImagePaths) {
            try { await fs.unlink(tempPath); } catch (e) { console.error(`Gagal menghapus file sementara ${tempPath}:`, e); }
        }
    }
}

/**
 * @swagger
 * /ocr:
 *   post:
 *     tags:
 *       - OCR
 *     summary: Melakukan OCR pada gambar atau PDF yang diunggah.
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               lang:
 *                 type: string
 *                 example: ind
 *               file_url:
 *                 type: string
 *               file_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teks hasil OCR
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 */
app.post("/ocr", upload.single("file"), async (req, res) => {
    let fileToClean = null;
    let requestedLang = req.body.lang || "ind";

    const trainedFiles = requestedLang.split("+");
    const availableLangs = [];

    for (const langCode of trainedFiles) {
        const gzPath = path.resolve("tessdata", `${langCode}.traineddata.gz`);
        const rawPath = path.resolve(`${langCode}.traineddata`);
        try {
            await fs.access(gzPath).catch(() => fs.access(rawPath));
            availableLangs.push(langCode);
        } catch {
            console.warn(`Bahasa '${langCode}' tidak ditemukan di tessdata. Melewati...`);
        }
    }

    let lang = "ind";
    let finalLangs = ["ind"];
    if (availableLangs.length > 0) {
        lang = availableLangs.join("+");
        finalLangs = availableLangs;
    }

    const worker = await createWorker(lang, 1, {
        langPath: "./tessdata",
        logger: m => console.log(m),
    });

    try {
        let ocrText = "";

        if (req.file) {
            fileToClean = path.resolve(req.file.path);
            if (req.file.mimetype === 'application/pdf') {
                ocrText = await processPdf(fileToClean, worker);
            } else {
                const { data: { text } } = await worker.recognize(fileToClean);
                ocrText = text;
            }
        } else if (req.body.file_url) {
            const fileUrl = req.body.file_url;

            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error(`Gagal mengunduh file dari URL: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            const extension = contentType.includes('pdf') ? '.pdf' : '.png';
            const tempFilePath = path.resolve('uploads', `url_file_${Date.now()}${extension}`);
            fileToClean = tempFilePath;

            const arrayBuffer = await response.arrayBuffer();
            await fs.writeFile(tempFilePath, Buffer.from(arrayBuffer));

            if (extension === '.pdf') {
                ocrText = await processPdf(tempFilePath, worker);
            } else {
                const { data: { text } } = await worker.recognize(tempFilePath);
                ocrText = text;
            }
        } else if (req.body.file_id) {
            const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${req.body.file_id}`);
            const tgData = await tgResponse.json();
            if (!tgData.ok) throw new Error("Gagal mendapatkan file dari Telegram");

            const filePath = tgData.result.file_path;
            const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;

            if (filePath.toLowerCase().endsWith('.pdf')) {
                const downloadResponse = await fetch(fileUrl);
                if (!downloadResponse.ok) throw new Error(`Gagal mengunduh file dari Telegram: ${downloadResponse.statusText}`);

                const tempPdfPath = path.resolve('uploads', `telegram_${Date.now()}_${path.basename(filePath)}`);
                fileToClean = tempPdfPath;

                const fileArrayBuffer = await downloadResponse.arrayBuffer();
                await fs.writeFile(tempPdfPath, Buffer.from(fileArrayBuffer));

                ocrText = await processPdf(tempPdfPath, worker);
            } else {
                const { data: { text } } = await worker.recognize(fileUrl);
                ocrText = text;
            }
        } else {
            return res.status(400).json({ error: "Tidak ada file yang diunggah atau file_id yang diberikan" });
        }

        await worker.terminate();
        res.json({ text: ocrText.trim() });

    } catch (err) {
        console.error("Error selama proses OCR:", err);
        await worker.terminate();
        res.status(500).json({ error: "Proses OCR gagal. Pastikan file valid dan poppler-utils terinstall di server." });
    } finally {
        if (fileToClean) {
            try {
                await fs.unlink(fileToClean);
            } catch (e) {
                console.error(`Gagal menghapus file utama ${fileToClean}:`, e);
            }
        }

        setTimeout(async () => {
            for (const langCode of finalLangs) {
                const trainedFile = path.resolve(`${langCode}.traineddata`);
                try {
                    await fs.unlink(trainedFile);
                    console.log(`File ${langCode}.traineddata berhasil dihapus`);
                } catch (e) {
                    if (e.code === 'EBUSY') {
                        console.warn(`File ${langCode}.traineddata sedang digunakan. Coba lagi nanti.`);
                    } else if (e.code !== 'ENOENT') {
                        console.error(`Gagal menghapus file ${langCode}.traineddata:`, e);
                    }
                }
            }
        }, 2000);
    }
});

/**
 * @swagger
 * /chat:
 *   post:
 *     tags:
 *       - Chatbot
 *     summary: Mengirim pesan ke chatbot dan menerima balasan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Balasan dari chatbot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 */
app.post("/chat", async (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({ error: "sessionId dan message diperlukan" });
    }

    if (!N8N_CHAT_WEBHOOK_URL) {
        console.error("N8N_CHAT_WEBHOOK_URL belum diatur di file .env");
        return res.status(500).json({ error: "Konfigurasi sisi server tidak lengkap." });
    }

    try {
        const response = await fetch(N8N_CHAT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, message })
        });

        if (!response.ok) {
            throw new Error(`Webhook n8n merespons dengan status: ${response.status}`);
        }

        const data = await response.json();
        const reply = data[0]?.output;

        if (!reply) {
             console.error("Struktur respons dari n8n tidak terduga:", data);
             throw new Error("Gagal mem-parsing respons dari chatbot.");
        }

        res.json({ reply });

    } catch (err) {
        console.error("Error saat menghubungi webhook chat:", err);
        res.status(500).json({ error: "Gagal berkomunikasi dengan layanan chat." });
    }
});

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OCR & Chatbot API",
      version: "1.0.0",
      description: "API untuk OCR dokumen dengan Tesseract.js dan integrasi chatbot via n8n",
    },
    servers: [
      {
        url: process.env.SERVER_URL,
      },
    ],
    tags: [
      {
        name: "Chatbot",
        description: "Mengirim pesan ke chatbot atau meminta insight dokumen"
      },
      {
        name: "OCR",
        description: "Melakukan OCR pada gambar atau dokumen"
      }
    ],
  },
  apis: ["./index.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server OCR berjalan di port ${PORT}`));
