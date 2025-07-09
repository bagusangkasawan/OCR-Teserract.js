# 🚀 API OCR & Chatbot dengan Tesseract.js

Proyek ini adalah REST API berbasis **Node.js + Express** yang dilengkapi dengan:

* 🎯 **OCR (Optical Character Recognition)** menggunakan [Tesseract.js](https://tesseract.projectnaptha.com/) untuk membaca teks dari gambar dan PDF.
* 🤖 **AI Chatbot** yang terhubung ke layanan eksternal seperti n8n untuk menjawab pertanyaan berbasis teks.
* 🔐 **Dukungan Otentikasi Ganda**: JWT dan API Key untuk fleksibilitas akses.

---

## 📦 Fitur Utama

✅ **Dukungan Multi-Format**
→ Memproses file **gambar** (JPG, PNG), **PDF**, **URL eksternal**, dan **file Telegram (file\_id)**.

✅ **Deteksi Bahasa Dinamis**
→ Pilih bahasa OCR dengan parameter `lang`, misalnya: `eng`, `ind`, atau `eng+ind`.

✅ **Otomatisasi Konversi PDF**
→ Mengubah PDF menjadi gambar sebelum OCR dijalankan (menggunakan `pdf-poppler`).

✅ **Integrasi Telegram**
→ Mendukung input melalui `file_id` dari bot Telegram.

✅ **AI Chatbot Endpoint**
→ `/chat` terhubung ke webhook n8n atau layanan lain untuk menjawab prompt pengguna.

✅ **Dukungan JWT & API Key**
→ Autentikasi fleksibel: cocok untuk aplikasi web (JWT) dan integrasi eksternal (API Key).

✅ **Swagger API Docs**
→ Dokumentasi interaktif tersedia di `/api-docs`.

✅ **Antarmuka Frontend**
→ UI berbasis **Bootstrap** di `http://localhost:3000` untuk OCR & Chat.

✅ **Pembersihan Otomatis**
→ File sementara (upload, traineddata) otomatis dihapus setelah proses selesai.

---

## 🛠️ Instalasi

```bash
git clone https://github.com/bagusangkasawan/OCR-Teserract.js.git
cd OCR-Teserract.js
npm install
```

> **Catatan:**
> Pastikan `Node.js` versi ≥ 18 dan `poppler-utils` telah terinstal di sistem Anda.
> (Linux: `sudo apt install poppler-utils`)

---

## ⚙️ Konfigurasi `.env`

```env
TELEGRAM_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
N8N_CHAT_WEBHOOK_URL=https://n8n.domain/webhook/your_webhook
SERVER_URL=http://localhost:3000
PORT=3000
JWT_SECRET=supersecretkey
MONGO_URI=mongodb://localhost:27017/ocr_chat_api
```

---

## 🚀 Menjalankan Aplikasi

```bash
npm start
```

Akses:

* UI: `http://localhost:3000`
* API (JWT): `/ocr`, `/chat`
* API (API Key): `/api/ocr`, `/api/chat`
* Swagger: [`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)

---

## 🧪 Cara Menggunakan

### 1️⃣ Melalui UI (Frontend Web)

1. Jalankan server
2. Akses `http://localhost:3000`
3. Unggah file atau input `file_id` Telegram
4. Klik **Proses OCR**
5. Klik **Tanyakan ke AI** untuk kirim hasil ke chatbot

---

### 2️⃣ Melalui API

#### 🔐 Registrasi & Login (JWT)

* `POST /register`
* `POST /login` → hasilkan token JWT

#### 📄 OCR

**Endpoint JWT:** `/ocr`
**Endpoint API Key:** `/api/ocr`

**Headers (JWT):**

```http
Authorization: Bearer <JWT_TOKEN>
```

**Headers (API Key):**

```http
x-api-key: <API_KEY>
```

**Metode:**

```http
POST multipart/form-data
```

**Body Options:**

1. Upload file:

   * `file` (binary)
   * `lang` (optional)

2. URL eksternal:

```json
{
  "file_url": "https://example.com/file.pdf",
  "lang": "eng"
}
```

3. Telegram file:

```json
{
  "file_id": "AgACAgUAAxkBA..."
}
```

**Contoh Respons:**

```json
{
  "text": "Isi teks hasil OCR..."
}
```

---

#### 💬 Chatbot

**Endpoint JWT:** `/chat`
**Endpoint API Key:** `/api/chat`

**Headers:**

* JWT: `Authorization: Bearer <token>`
* API Key: `x-api-key: <your-api-key>`

**Body:**

```json
{
  "sessionId": "user-session-uuid",
  "message": "Apa isi dokumen ini?"
}
```

**Respons:**

```json
{
  "reply": "Ringkasan isi dokumen Anda..."
}
```

---

## 🧭 Dokumentasi Swagger

👉 [`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)

---

## 📁 Struktur Proyek

```
OCR-Teserract.js/
├── uploads/               # File upload sementara
├── public/
│   └── index.html         # UI OCR & Chat
├── tessdata/              # Model bahasa (.traineddata.gz)
├── index.js               # Entry point Express
├── package.json
└── .env                   # Konfigurasi rahasia
```

---

## 💡 Tips

* Tambahkan model bahasa baru di folder `tessdata/` dalam format `.traineddata.gz`.
* Kombinasikan bahasa seperti `eng+ind` untuk OCR dokumen campuran.
* Gunakan JWT untuk akses user-based & API Key untuk automasi.

---

## 👨‍💻 Pengembang

**Bagus Angkasawan Sumantri Putra**  
🔗 [LinkedIn](https://www.linkedin.com/in/bagus-angkasawan-sumantri-putra)  
📧 bagusasp01@gmail.com  

---

## 📜 Lisensi

© 2025 Bagus Angkasawan Sumantri Putra. Semua hak dilindungi.
