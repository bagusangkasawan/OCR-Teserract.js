# 🚀 API OCR & Chatbot dengan Tesseract.js

Proyek ini menyediakan layanan **REST API** berbasis Node.js + Express yang telah dikembangkan untuk menyertakan fungsionalitas canggih:

* **OCR (*Optical Character Recognition*)**: Menggunakan [Tesseract.js](https://tesseract.projectnaptha.com/) untuk mengekstrak teks dari gambar dan PDF.
* **AI Chatbot**: Terintegrasi dengan layanan eksternal (misalnya, n8n) untuk memberikan wawasan, ringkasan, atau menjawab pertanyaan berdasarkan teks hasil OCR.

## 📦 Fitur Unggulan

* ✅ **Dukungan Multi-Format**: Menerima file **Gambar** (JPG, PNG) dan **PDF** untuk OCR.
* ✅ **Konversi PDF Otomatis**: Secara transparan mengubah halaman PDF menjadi gambar di backend untuk dianalisis.
* ✅ **Integrasi Fleksibel**:
  * Upload file lokal melalui `multipart/form-data`.
  * Memproses file dari Telegram menggunakan `file_id`.
* ✅ **Chatbot Interaktif**: Endpoint `/chat` untuk berinteraksi dengan AI, menganalisis hasil OCR, atau percakapan umum.
* ✅ **Frontend Modern**: Antarmuka pengguna dua kolom (OCR & Chat) yang responsif, dibangun dengan Bootstrap.
* ✅ **Render Markdown**: Jendela obrolan dapat menampilkan respons dari bot dalam format Markdown (tebal, daftar, blok kode, dll).
* ✅ **Manajemen File Efisien**: File yang diunggah dan file konversi sementara dihapus secara otomatis setelah diproses.
* ✅ **Siap Deploy**: Mudah di-deploy ke layanan hosting Node.js seperti Azure, Heroku, atau VPS.

## 🛠️ Instalasi

1. Clone repository:
   ```bash
   git clone https://github.com/bagusangkasawan/OCR-Teserract.js.git
   cd OCR-Teserract.js
   ```
2. Install dependensi Node.js:
   ```bash
   npm install
   ```

> **Catatan:** Pastikan Node.js minimal versi 18 sudah terpasang di sistem Anda.

## ⚙️ Konfigurasi

Buat file `.env` di direktori root, lalu isi dengan variabel lingkungan yang diperlukan:

```env
# Token untuk bot Telegram Anda (opsional, jika menggunakan fitur file_id)
TELEGRAM_TOKEN=YOUR_TELEGRAM_BOT_TOKEN

# URL webhook untuk layanan chatbot (n8n, dll.)
N8N_CHAT_WEBHOOK_URL=YOUR_N8N_WEBHOOK_URL

# Port untuk server
PORT=3000
```

## 🚀 Menjalankan Aplikasi

```bash
npm start
```

Server akan berjalan di [http://localhost:3000](http://localhost:3000). Membuka URL ini di browser akan langsung menampilkan antarmuka pengguna interaktif.

## 🧪 Cara Pengujian

### 1️⃣ Via Frontend (Browser)

Cara termudah untuk menguji adalah melalui antarmuka yang disediakan:
1. Jalankan server (`npm start`).
2. Buka `http://localhost:3000` di browser.
3. **Untuk OCR**: Unggah file gambar/PDF, atau masukkan `file_id` Telegram, lalu klik **Proses OCR**.
4. **Untuk Chat**: Setelah hasil OCR muncul, klik tombol **Tanyakan ke AI** untuk mengirim teks ke chatbot, atau ketik pertanyaan apa pun di jendela obrolan.

### 2️⃣ Via Postman atau API Client Lainnya

#### Endpoint: `/ocr`

Mengekstrak teks dari file gambar atau PDF.

* **Method**: `POST`
* **URL**: `http://localhost:3000/ocr`
* **Opsi 1: Upload File**
  * **Body** → `form-data`
  * **Key**: `file`
  * **Value**: (Pilih file gambar atau PDF Anda)
* **Opsi 2: Telegram File ID**
  * **Headers**: `Content-Type: application/json`
  * **Body** → `raw` → `JSON`
    ```json
    {
      "file_id": "ID_FILE_DARI_TELEGRAM"
    }
    ```

#### Endpoint: `/chat`

Mengirim pesan ke AI Chatbot.

* **Method**: `POST`
* **URL**: `http://localhost:3000/chat`
* **Headers**: `Content-Type: application/json`
* **Body** → `raw` → `JSON`
  ```json
  {
    "sessionId": "string_acak_untuk_sesi_unik",
    "message": "Ini adalah pesan atau prompt Anda."
  }
  ```

## 🏗️ Struktur Folder

```
OCR-Teserract.js/
├── uploads/               # Folder sementara untuk file yang diunggah
├── public/
│   └── index.html         # Antarmuka pengguna (frontend)
├── ind.traineddata        # Model bahasa Indonesia untuk Tesseract
├── index.js               # Kode utama server Express (backend)
├── package.json
└── .env                   # File konfigurasi (jangan di-commit ke repositori publik)
```

## 💡 Catatan Penting

* **Performa**: Proses OCR pada file PDF multi-halaman mungkin memerlukan waktu beberapa saat tergantung pada kompleksitas dan jumlah halaman.

## 👤 Developer

Proyek ini dibuat dan dikembangkan oleh:

**Bagus Angkasawan Sumantri Putra**  
🔗 [LinkedIn](https://www.linkedin.com/in/bagus-angkasawan-sumantri-putra)  
📧 bagusasp01@gmail.com  

Copyright © 2025 Bagus Angkasawan Sumantri Putra
