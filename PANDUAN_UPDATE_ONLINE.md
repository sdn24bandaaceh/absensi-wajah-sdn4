# Panduan Pembaruan Aplikasi Absensi Wajah

Setiap kali Anda selesai melakukan perubahan pada kode aplikasi ini di VS Code, Anda perlu melakukan pembaruan di 2 tempat agar aplikasi yang online (Vercel) dan database (Google Script) ikut terbarui.

## TAHAP 1: Pembaruan Tampilan Web (Vercel / GitHub)
Langkah ini untuk memperbarui tampilan halaman web (file HTML, CSS, JS).

1. Buka **Terminal** di VS Code (tekan `Ctrl` + <code>`</code> atau pilih menu *Terminal -> New Terminal* di atas).
2. Ketik perintah berikut secara berurutan dan tekan **Enter** pada setiap barisnya:

   ```powershell
   git add .
   ```
   *(Perintah ini akan mengumpulkan semua file yang telah Anda ubah)*

   ```powershell
   git commit -m "Tulis pesan pembaruan Anda di sini"
   ```
   *(Contoh: git commit -m "Memperbaiki tabel rekapitulasi")*

   ```powershell
   git push
   ```
   *(Perintah ini akan mengirim kode ke GitHub. Setelah ini selesai, Vercel akan otomatis memperbarui web Anda dalam 1-2 menit).*

---

## TAHAP 2: Pembaruan Database (Google Apps Script)
Langkah ini **WAJIB** dilakukan **JIKA** Anda melakukan perubahan atau penambahan pada file `Code.gs`. (Jika Anda hanya mengubah file HTML, tahap ini boleh dilewati).

1. Buka file `Code.gs` di VS Code Anda.
2. Salin (**Copy**) seluruh isi kodenya dari baris pertama hingga terakhir.
3. Buka tab **Google Apps Script Editor** di browser Anda.
4. Timpa (**Paste**) kode yang lama dengan kode yang baru saja Anda salin.
5. Klik ikon **Simpan** (Save).
6. **Lakukan Penerapan Versi Baru (Wajib):**
   - Klik tombol **Deploy** di sudut kanan atas.
   - Pilih **Manage deployments**.
   - Klik ikon **Pensil (Edit)** di sebelah kanan nama proyek.
   - Pada kolom *Version*, klik dan wajib pilih **New version** (Versi baru).
   - Klik tombol **Deploy**.

> ⚠️ **CATATAN PENTING:** 
> Jika Anda hanya menekan "Save" tanpa melakukan "Deploy New Version" di Google Script, maka web Anda yang online akan tetap nyangkut membaca pengaturan database versi yang lama, sehingga bisa menimbulkan error (seperti data kosong).
