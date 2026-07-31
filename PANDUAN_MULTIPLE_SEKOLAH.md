# Panduan Memperbanyak Aplikasi Absensi (Untuk Banyak Sekolah)

Karena aplikasi absensi ini menggunakan arsitektur **Serverless** (di mana Google Sheets bertindak sebagai Database + Server API dan HTML/JS statis sebagai Frontend), cara paling aman, mandiri, dan mudah untuk membuat aplikasi ini bisa dipakai oleh banyak sekolah adalah dengan membuat **Satu Salinan (Clone) Sistem secara Keseluruhan untuk Setiap Sekolah**.

Pendekatan ini memastikan data tiap sekolah (termasuk foto wajah, koordinat GPS, jam kerja, dan pengaturan) **terisolasi secara aman 100%** dan tidak akan saling bercampur.

Ikuti tiga langkah utama berikut setiap kali Anda ingin menambahkan sekolah baru (misal: "Sekolah B").

---

## Langkah 1: Gandakan (Clone) Database Google Sheet

Langkah pertama adalah membuat salinan otak (backend) dari aplikasi ini.

1. Buka file **Google Sheet Database** Absensi yang saat ini Anda gunakan.
2. Di pojok kiri atas, klik menu **File** > **Make a copy** (Buat salinan).
3. Beri nama file baru yang jelas, misalnya: `Database Absensi Sekolah B`, lalu simpan.
4. Tunggu beberapa saat sampai tab Google Sheet baru terbuka.
5. (Opsional tapi penting): Bersihkan riwayat absen di sheet `Attendance`, hapus data pegawai lama di sheet `Users` (kecuali akun Admin/Superadmin), dan ubah profil nama sekolah di sheet `Settings` agar bersih sebelum diserahkan ke Sekolah B.

---

## Langkah 2: Deploy Ulang API (Dapatkan Link Backend Baru)

Setelah Database baru siap, Anda harus mengaktifkan API-nya agar bisa dihubungkan ke aplikasi.

1. Pada Google Sheet `Database Absensi Sekolah B` yang baru dibuat tadi, klik menu **Extensions** (Ekstensi) > **Apps Script**.
2. Tab baru Apps Script (Code.gs) akan terbuka. Script-nya sudah otomatis tercopy!
3. Di pojok kanan atas, klik tombol biru **Deploy** > pilih **New deployment**.
4. Pada jendela yang muncul, pastikan pengaturan berikut:
   - **Select type**: Web app (ikon gerigi)
   - **Description**: (Bisa diisi: *API Sekolah B*)
   - **Execute as**: `Me` (Penting! Agar skrip menggunakan akun Google Drive Anda)
   - **Who has access**: `Anyone` (Penting! Agar aplikasi bisa mengirim data)
5. Klik **Deploy**.
6. *Catatan: Jika ini pertama kali, Google akan meminta otorisasi (Review Permissions > pilih akun Google Anda > Advanced > Go to... > Allow).*
7. Setelah selesai, Anda akan melihat sebuah URL panjang di bawah tulisan **Web app**. Klik tombol **Copy**.
   > URL ini adalah kunci/nyawa dari backend Sekolah B. Jangan sampai hilang.

---

## Langkah 3: Gandakan Folder Aplikasi (Frontend)

Sekarang kita akan membuat salinan tampilan (frontend) aplikasi dan menghubungkannya dengan API Sekolah B.

1. Buka File Explorer di komputer Anda, cari folder `absensi-wajah` (atau folder utama project Anda).
2. **Copy** (Ctrl+C) seluruh folder tersebut, lalu **Paste** (Ctrl+V) di tempat yang sama.
3. Ubah nama foldernya menjadi sesuatu yang spesifik, misalnya `absensi-sekolah-b`.
4. Buka folder `absensi-sekolah-b` tersebut, lalu cari file **`app.js`** yang berada di dalam folder `assets/js/`.
5. Buka file `app.js` menggunakan aplikasi Code Editor (seperti VS Code atau Notepad).
6. Di baris awal (sekitar baris ke-4), Anda akan menemukan kode konfigurasi URL API, contohnya seperti ini:
   ```javascript
   const App = {
     // Ganti link ini jika mendeploy ulang backend Google Apps Script
     API_URL: 'https://script.google.com/macros/s/AKfycbxxxx.../exec',
   ```
7. **Hapus link lama**, lalu **Paste (tempel)** link Web App baru yang baru saja Anda salin di **Langkah 2**. Pastikan link tetap diapit oleh tanda kutip tunggal (`'...'`).
8. **Simpan** file `app.js` (Ctrl+S).

---

## Selesai! 🎉

Sekarang, folder `absensi-sekolah-b` sudah sepenuhnya mandiri. Aplikasi baru ini akan menyimpan semua hasil foto absen, titik lokasi GPS, dan daftar pegawainya langsung ke **Database Absensi Sekolah B**. Sistem untuk sekolah lama Anda tidak akan terpengaruh sama sekali.

**Langkah Terakhir (Hosting):**
Anda bisa meng-upload (push) folder `absensi-sekolah-b` ini ke GitHub (buat repository baru), lalu mengaktifkan **GitHub Pages** (atau Vercel) seperti biasa. Anda bisa membuat link unik untuk mereka, misalnya:
- `sekolah-a.github.io/absensi`
- `sekolah-b.github.io/absensi`

Ulangi ketiga langkah ini berulang kali sebanyak apa pun sekolah yang mendaftar ke sistem Anda!

---

## Bagaimana Jika Ada Perubahan / Fitur Baru di Aplikasi Utama?

Jika suatu saat Anda menambahkan fitur baru di aplikasi utama (misalnya menambahkan menu cetak PDF) dan ingin menerapkannya ke **Sekolah B**, ikuti cara sinkronisasi manual ini:

### 1. Update Frontend (Tampilan HTML/JS)
Untuk meng-update tampilan, Anda cukup melakukan _Copy-Paste_ file yang berubah.
1. Copy file/folder yang baru diupdate dari folder utama `absensi-wajah`.
2. Paste ke dalam folder `absensi-sekolah-b` (timpa/replace file yang lama).
3. **SANGAT PENTING**: **JANGAN PERNAH** menimpa/me-replace file `assets/js/app.js` milik Sekolah B, karena file tersebut menyimpan `API_URL` unik milik Sekolah B. Jika tidak sengaja tertimpa, Sekolah B akan salah mengirim data ke database Sekolah A!
4. Upload kembali folder Sekolah B ke GitHub/Hosting.

### 2. Update Backend (Code.gs)
Jika perubahan yang Anda buat melibatkan logika server (Google Apps Script):
1. Buka file `Code.gs` di aplikasi utama Anda, block semua kode (Ctrl+A), lalu Copy (Ctrl+C).
2. Buka Ekstensi > Apps Script di **Database Sekolah B**.
3. Block semua kode lama di sana, lalu Paste (timpa) dengan kode yang baru. Simpan.
4. Agar perubahan ini terbaca oleh aplikasi tanpa merubah link URL lama, klik **Deploy** > **Manage deployments**.
5. Klik ikon pensil (Edit) di sebelah deployment aktif.
6. Pada bagian **Version**, ubah menjadi **New version**, lalu klik **Deploy**.
7. Selesai! Link API tidak akan berubah, namun kode di dalamnya sudah menggunakan versi terbaru.
