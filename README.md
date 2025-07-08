# 🚀 API OCR & Chatbot dengan Tesseract.js

Proyek ini adalah REST API berbasis **Node.js + Express** yang dilengkapi dengan:

* 🎯 **OCR (Optical Character Recognition)** menggunakan [Tesseract.js](https://tesseract.projectnaptha.com/) untuk membaca teks dari gambar dan PDF.
* 🤖 **AI Chatbot** yang terhubung ke layanan eksternal seperti n8n untuk menjawab pertanyaan berdasarkan hasil OCR atau pesan umum.

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

> **Catatan:** Pastikan `Node.js` versi ≥ 18 dan `poppler-utils` telah terinstal di sistem Anda (`sudo apt install poppler-utils` di Linux).

---

## ⚙️ Konfigurasi `.env`

```env
TELEGRAM_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
N8N_CHAT_WEBHOOK_URL=https://n8n.domain/webhook/your_webhook
SERVER_URL=http://localhost:3000
PORT=3000
```

---

## 🚀 Menjalankan Aplikasi

```bash
npm start
```

Akses:

* UI: `http://localhost:3000`
* API: `http://localhost:3000/ocr` dan `/chat`
* Swagger: `http://localhost:3000/api-docs`

---

## 🧪 Cara Menggunakan

### 1️⃣ Via Browser (UI)

1. Jalankan server
2. Buka `http://localhost:3000`
3. Unggah file (gambar/PDF) atau masukkan `file_id` Telegram
4. Klik **Proses OCR**
5. Klik **Tanyakan ke AI** untuk kirim hasil OCR ke chatbot

### 2️⃣ Via API (Postman / HTTP client)

#### 🔍 OCR

**POST** `/ocr`

##### Opsi 1: Upload file

* `Content-Type`: `multipart/form-data`
* Body:

  * `file`: upload file
  * `lang` (opsional): contoh `eng`

##### Opsi 2: URL eksternal

```json
{
  "file_url": "https://example.com/sample.pdf",
  "lang": "eng"
}
```

##### Opsi 3: Telegram `file_id`

```json
{
  "file_id": "AgACAgUAAxkBA..."
}
```

**Respons:**

```json
{
  "text": "Teks hasil OCR..."
}
```

#### 💬 Chatbot

**POST** `/chat`

```json
{
  "sessionId": "user-session-uuid",
  "message": "Apa isi dokumen ini?"
}
```

**Respons:**

```json
{
  "reply": "Ini ringkasan dokumen Anda..."
}
```

---

## 🧭 Dokumentasi API

Swagger tersedia di:
👉 [`http://localhost:3000/api-docs`](http://localhost:3000/api-docs)

---

## 📁 Struktur Proyek

```
OCR-Teserract.js/
├── uploads/               # File upload sementara
├── public/
│   └── index.html         # UI OCR & Chat
├── tessdata/              # Model bahasa (compressed .traineddata.gz)
├── index.js               # Entry point backend Express
├── package.json
└── .env                   # Konfigurasi rahasia
```

---

## 💡 Tips

* Anda dapat menambahkan model bahasa baru di folder `tessdata/` dalam format `.traineddata.gz`.
* Gunakan kombinasi bahasa seperti `eng+ind` untuk dokumen campuran.
* Jangan lupa set `N8N_CHAT_WEBHOOK_URL` untuk fitur AI Chatbot.

---

## 👨‍💻 Pengembang

**Bagus Angkasawan Sumantri Putra**  
🔗 [LinkedIn](https://www.linkedin.com/in/bagus-angkasawan-sumantri-putra)  
📧 bagusasp01@gmail.com  

---

## 📜 Lisensi

© 2025 Bagus Angkasawan Sumantri Putra. Semua hak dilindungi.
