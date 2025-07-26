// index.js
import express from "express";
import cors from "cors";
import { createWorker } from "tesseract.js";
import fetch from "node-fetch";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import { promises as fs } from "fs";
import { convert } from 'pdf-poppler';
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

dotenv.config();

// --- Konfigurasi Dasar & Koneksi DB ---
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(MONGO_URI)
    .then(() => console.log("Berhasil terhubung ke MongoDB"))
    .catch(err => console.error("Koneksi MongoDB gagal:", err));

// --- Model Pengguna (User) ---
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    apiKey: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Rute untuk halaman utama (/) yang menampilkan index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rute kustom untuk /feature yang menampilkan main.html
app.get('/feature', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

const upload = multer({ dest: "uploads/" });

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const N8N_CHAT_WEBHOOK_URL = process.env.N8N_CHAT_WEBHOOK_URL;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit",
});

app.use(limiter);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.user = decoded;
    next();
  });
};

const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ message: "API Key diperlukan" });
  }

  const user = await User.findOne({ apiKey });

  if (!user) {
    return res.status(403).json({ message: "API Key tidak valid" });
  }

  req.user = user;
  next();
};

// --- Rute Otentikasi & User ---
/**
 * @swagger
 * /register:
 *   post:
 *     tags:
 *       - Otentikasi
 *     summary: Mendaftarkan pengguna baru
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Registrasi berhasil
 *       400:
 *         description: Username atau email sudah digunakan
 */
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Username, email, dan password diperlukan" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username atau email sudah digunakan" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            apiKey: crypto.randomBytes(20).toString('hex')
        });
        await newUser.save();
        res.status(201).json({ message: "Registrasi berhasil" });
    } catch (error) {
        res.status(500).json({ message: "Server error saat registrasi" });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Otentikasi
 *     summary: Login pengguna
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - login
 *               - password
 *             properties:
 *               login:
 *                 type: string
 *                 description: Username atau email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login berhasil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Kredensial tidak valid
 */
app.post('/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        const user = await User.findOne({ $or: [{ username: login }, { email: login }] });
        if (!user) {
            return res.status(400).json({ message: "Kredensial tidak valid" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Kredensial tidak valid" });
        }
        const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "Server error saat login" });
    }
});

/**
 * @swagger
 * /api/me:
 *   get:
 *     tags:
 *       - Pengguna
 *     summary: Mendapatkan informasi pengguna saat ini
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Detail pengguna
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 apiKey:
 *                   type: string
 *       401:
 *         description: Token tidak disediakan
 *       403:
 *         description: Token tidak valid
 */
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// --- Fungsi Helper & Logika Inti ---
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

const ocrAndChatLogic = {
    performOcr: async (req) => {
    let fileToClean = null;
    const requestedLang = req.body.lang || "ind";
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

    const finalLangs = availableLangs.length > 0 ? availableLangs : ["ind"];
    const lang = finalLangs.join("+");

    const worker = await createWorker(lang, 1, {
        langPath: "./tessdata",
        logger: m => console.log(m),
    });

    try {
        let ocrText = "";

        if (req.file) {
        fileToClean = path.resolve(req.file.path);
        ocrText = req.file.mimetype === 'application/pdf'
            ? await processPdf(fileToClean, worker)
            : (await worker.recognize(fileToClean)).data.text;

        } else if (req.body.file_url) {
        const response = await fetch(req.body.file_url);
        if (!response.ok) throw new Error(`Gagal unduh: ${response.statusText}`);

        const extension = response.headers.get('content-type').includes('pdf') ? '.pdf' : '.png';
        fileToClean = path.resolve('uploads', `url_${Date.now()}${extension}`);
        await fs.writeFile(fileToClean, Buffer.from(await response.arrayBuffer()));
        ocrText = extension === '.pdf'
            ? await processPdf(fileToClean, worker)
            : (await worker.recognize(fileToClean)).data.text;

        } else if (req.body.file_id) {
            const tgResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getFile?file_id=${req.body.file_id}`);
            const tgData = await tgResponse.json();
            if (!tgData.ok || !tgData.result?.file_path) throw new Error("Gagal mendapatkan file dari Telegram");

            const filePath = tgData.result.file_path;
            const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${filePath}`;
            const extension = filePath.toLowerCase().endsWith('.pdf') ? '.pdf' : '.png';
            
            const downloadResponse = await fetch(fileUrl);
            if (!downloadResponse.ok) throw new Error(`Gagal mengunduh file dari Telegram: ${downloadResponse.statusText}`);

            const fileBuffer = await downloadResponse.arrayBuffer();
            fileToClean = path.resolve('uploads', `telegram_${Date.now()}${extension}`);
            await fs.writeFile(fileToClean, Buffer.from(fileBuffer));

            ocrText = extension === '.pdf'
                ? await processPdf(fileToClean, worker)
                : (await worker.recognize(fileToClean)).data.text;

        } else {
        throw new Error("Tidak ada file yang diunggah atau file_id yang diberikan");
        }

        return { text: ocrText.trim() };

    } finally {
        try { await worker.terminate(); } catch (e) { console.warn("Gagal terminate worker:", e); }

        if (fileToClean) {
        try { await fs.unlink(fileToClean); } catch (e) {
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
    },

  performChat: async (req) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return { status: 400, body: { error: "sessionId dan message diperlukan" } };
    if (!N8N_CHAT_WEBHOOK_URL) return { status: 500, body: { error: "Konfigurasi server tidak lengkap." } };

    const response = await fetch(N8N_CHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, user: req.user }),
    });

    if (!response.ok) throw new Error(`Webhook error: ${response.status}`);

    const data = await response.json();
    const reply = data[0]?.output;
    if (!reply) throw new Error("Gagal parsing respons chatbot.");

    return { reply };
  }
};

// --- Rute Aplikasi (Dilindungi) ---
/**
 * @swagger
 * /ocr:
 *   post:
 *     tags:
 *       - Aplikasi Web
 *     summary: Melakukan OCR dari file atau URL (JWT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               file_url:
 *                 type: string
 *               lang:
 *                 type: string
 *                 description: Bahasa OCR (opsional, default "ind")
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
 *       400:
 *         description: Tidak ada input file atau URL
 *       500:
 *         description: Proses OCR gagal
 */
app.post("/ocr", authenticateToken, upload.single("file"), async (req, res) => {
    try {
        const result = await ocrAndChatLogic.performOcr(req);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || "Proses OCR gagal." });
    }
});

/**
 * @swagger
 * /chat:
 *   post:
 *     tags:
 *       - Aplikasi Web
 *     summary: Mengirim pesan ke chatbot (JWT)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Balasan chatbot
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 reply:
 *                   type: string
 *       400:
 *         description: sessionId atau message tidak ada
 *       500:
 *         description: Gagal berkomunikasi dengan layanan chat
 */
app.post("/chat", authenticateToken, async (req, res) => {
    try {
        const result = await ocrAndChatLogic.performChat(req);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || "Gagal berkomunikasi dengan layanan chat." });
    }
});

/**
 * @swagger
 * /api/ocr:
 *   post:
 *     tags:
 *       - API Eksternal
 *     summary: Melakukan OCR dari file atau URL (API Key)
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               file_url:
 *                 type: string
 *               lang:
 *                 type: string
 *                 description: Bahasa OCR (opsional, default "ind")
 *     responses:
 *       200:
 *         description: Teks hasil OCR
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: API Key tidak diberikan
 *       403:
 *         description: API Key tidak valid
 *       500:
 *         description: Proses OCR gagal
 */
app.post("/api/ocr", authenticateApiKey, upload.single("file"), async (req, res) => {
    try {
        const result = await ocrAndChatLogic.performOcr(req);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || "Proses OCR gagal via API Key." });
    }
});

/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags:
 *       - API Eksternal
 *     summary: Mengirim pesan ke chatbot (API Key)
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - message
 *             properties:
 *               sessionId:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Balasan chatbot
 *       400:
 *         description: Input tidak lengkap
 *       401:
 *         description: API Key tidak diberikan
 *       403:
 *         description: API Key tidak valid
 *       500:
 *         description: Gagal chat
 */
app.post("/api/chat", authenticateApiKey, async (req, res) => {
    try {
        const result = await ocrAndChatLogic.performChat(req);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message || "Gagal chat via API Key." });
    }
});

// --- Swagger & Server Start ---
const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "AIaaS OCR & Chatbot API",
        version: "3.0.0",
        description: "API untuk OCR dan Chatbot dengan otentikasi JWT & API Key berbasis MongoDB",
      },
      servers: [{ url: process.env.SERVER_URL || 'http://localhost:3000' }],
      tags: [
        { name: "Otentikasi", description: "Endpoint untuk registrasi dan login" },
        { name: "Pengguna", description: "Operasi terkait data pengguna" },
        { name: "Aplikasi Web", description: "Endpoint yang digunakan oleh antarmuka web (JWT)" },
        { name: "API Eksternal", description: "Endpoint untuk penggunaan via API Key" }
      ],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: "Masukkan token JWT" },
          apiKeyAuth: { type: 'apiKey', in: 'header', name: 'x-api-key', description: "Masukkan API Key" }
        }
      },
    },
    apis: ["./index.js"],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));
