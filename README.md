# 🚀 OCR Tesseract.js API

Proyek ini menyediakan layanan **REST API** berbasis Node.js + Express untuk melakukan OCR (*Optical Character Recognition*) menggunakan [Tesseract.js](https://tesseract.projectnaptha.com/).

API ini mendukung:
* ✅ Upload gambar lokal melalui form-data
* ✅ Pengambilan gambar Telegram menggunakan `file_id`
* ✅ Bahasa Indonesia (`ind`)
* ✅ Contoh frontend sederhana berbasis Bootstrap
* ✅ Mudah di-deploy ke server Node.js mana pun

---

## 📦 Fitur

* Server Express.js
* Mendukung upload file (multer)
* Integrasi Telegram Bot (`getFile` → `file_id`)
* Tesseract.js sebagai OCR engine
* Otomatis menghapus file setelah OCR selesai
* Contoh frontend di `public/index.html`
* Siap di-deploy ke Azure App Service atau server VPS

---

## 🛠️ Instalasi

1. Clone repository:

```bash
git clone https://github.com/bagusangkasawan/OCR-Teserract.js.git
cd OCR-Teserract.js
```

2. Install dependensi:

```bash
npm install
```

> **Note:** Pastikan Node.js minimal versi 18 sudah terpasang di sistem Anda.

---

## ⚙️ Konfigurasi

Buat file `.env` di direktori root, lalu isi seperti berikut:

```env
TELEGRAM_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
PORT=3000
```

---

## 🚀 Menjalankan Aplikasi

```bash
npm start
```

Server akan berjalan di:
[http://localhost:3000](http://localhost:3000)

Saat Anda membuka URL tersebut di browser, secara otomatis akan menampilkan halaman `index.html` sebagai antarmuka pengujian.

---

## 🧪 Cara Pengujian

### 1️⃣ Via Frontend (Browser)

* Jalankan server (`npm start`)
* Buka `http://localhost:3000`
* Upload gambar, atau masukkan Telegram `file_id`
* Klik **Proses OCR**
* Hasilnya akan muncul di area hasil

### 2️⃣ Via Postman

* **OCR dari upload file**

  * method: `POST`
  * url: `http://localhost:3000/ocr`
  * Body → form-data

    * `image` (tipe file)

* **OCR dari Telegram file\_id**

  * method: `POST`
  * url: `http://localhost:3000/ocr`
  * Body → form-data

    * `file_id` → masukkan `file_id` dari Telegram

---

## 🏗️ Struktur Folder

```
OCR-Teserract.js
├── uploads/               # folder temporary untuk upload file
├── public/
│   └── index.html         # halaman frontend untuk pengujian
├── ind.traineddata        # model bahasa Indonesia untuk Tesseract
├── index.js               # kode utama Express server
├── package.json
└── .env                   # file konfigurasi rahasia (jangan commit ke publik)
```

---

## 💡 Catatan

* File upload bersifat sementara, otomatis dihapus setelah OCR selesai
* Tesseract.js dijalankan dengan bahasa Indonesia (`ind`)
* Pastikan bandwidth server memadai, karena OCR bisa membutuhkan waktu beberapa detik tergantung ukuran file

---

## 👤 Developer

Proyek ini dibuat dan dikembangkan oleh:

**Bagus Angkasawan Sumantri Putra**  
🔗 [LinkedIn](https://www.linkedin.com/in/bagus-angkasawan-sumantri-putra)  
📧 bagusasp01@gmail.com  

Copyright © 2025 Bagus Angkasawan Sumantri Putra

Lisensi bebas digunakan untuk pembelajaran dan pengembangan non-komersial. Untuk penggunaan komersial, silakan hubungi developer terlebih dahulu.
