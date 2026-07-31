# Catatan Revisi & Pembaruan Aplikasi Absensi Wajah

Dokumen ini berisi daftar perubahan, perbaikan *bug*, dan penambahan fitur yang dilakukan pada aplikasi. Catatan ini dibuat agar riwayat perubahan lebih mudah dilacak dan dipahami di kemudian hari.

---

## [21 Juli 2026] - Revisi Audit Aksesibilitas, UI, dan Keamanan

### 1. Perbaikan Tata Letak Mobile (Responsivitas UI)
*   **Masalah:** Saat tombol menu sidebar (garis tiga) ditekan melalui layar *smartphone*, halaman utama bergeser terlalu jauh ke samping (280px) sehingga layar menjadi *error* dan menimbulkan *scroll* menyamping.
*   **File yang diubah:** `assets/css/dashboard.css`
*   **Solusi:** Menghapus aturan CSS `margin-left: 280px` pada bagian `@media (max-width: 991.98px)`. Saat ini, sidebar akan muncul mengambang (*overlay*) di atas konten utama tanpa merusak tata letak layar HP.

### 2. Perbaikan Celah Keamanan Halaman Admin (Bug Logic)
*   **Masalah:** Halaman khusus admin (seperti `pegawai.html`, `pengaturan.html`) diproteksi di sisi-klien menggunakan fungsi `endsWith()`. Hal ini menimbulkan celah di mana akun biasa dapat meretas perlindungan ini dengan menambahkan parameter asal di akhir tautan (misalnya: `pegawai.html?admin=true`).
*   **File yang diubah:** `assets/js/dashboard.js`
*   **Solusi:** Merombak fungsi `restrictAdminPages()`. Kode sekarang difilter menggunakan `split('/').pop()` yang secara spesifik akan mengambil dan memverifikasi nama asli dari file HTML tersebut, sehingga parameter URL apapapun tidak akan mampu menembus blokade.

### 3. Peningkatan Standar Aksesibilitas (a11y)
*   **Masalah:** Beberapa tombol interaktif di *header* tidak memiliki teks penjelas (hanya berupa lambang atau ikon). Hal ini membuat aplikasi kurang bersahabat bagi penyandang disabilitas yang harus menggunakan *Screen Reader* (pembaca layar otomatis).
*   **File yang diubah:** `dashboard.html` & `absensi.html`
*   **Solusi:** 
    * Menambahkan atribut `aria-label="Tampilkan Sidebar"` pada tombol pembuka menu utama.
    * Menambahkan atribut `aria-label="Ubah Tema"` pada tombol mode gelap/terang.
    * Menambahkan `aria-hidden="true"` pada ikon-ikon dekorasi (logo Bootstrap Icons) agar pembaca layar mengabaikannya dan tidak menimbulkan suara *error* atau berisik pada pengguna.

### 4. Perbaikan Bug Geofencing (Tombol Absen Tetap Aktif)
*   **Masalah:** Pada saat pemindaian wajah, meskipun pengguna berada di luar radius sekolah yang diizinkan (Geofencing), tombol **Absen Masuk** dan **Absen Pulang** tetap menyala hijau dan bisa ditekan. Terkadang membingungkan karena tidak ada indikasi yang jelas pada tombol.
*   **File yang diubah:** `assets/js/absensi.js`
*   **Solusi:** Memodifikasi fungsi `checkReadyState()` agar menghitung kembali jarak. Jika berada di luar radius (`distance > maxRadius`), tombol akan dimatikan (disabled), diubah warnanya menjadi abu-abu, dan label tombolnya akan diubah secara dinamis menjadi peringatan **"Di Luar Area Sekolah"**. Ditambahkan pula pengaman sekunder pada fungsi `processAbsensi()` untuk memblokir pendaftaran absen dan menampilkan pop-up gagal jika berhasil ditekan.

### 5. Mengaktifkan Widget Pengumuman dan Izin (Dashboard)
*   **Masalah:** Daftar *Pengumuman* dan *Izin Menunggu Persetujuan* pada halaman *Dashboard* masih menggunakan tampilan sementara (statis) dan tidak menampilkan data asli.
*   **File yang diubah:** `Code.gs`, `dashboard.html`, `assets/js/dashboard.js`
*   **Solusi:** Menambahkan fungsi untuk memuat data pengumuman (`ANNOUNCEMENTS`) secara dinamis dari pengaturan (*Settings*) *database* Google Sheets. Selain itu, mengubah tampilan daftar *Izin Menunggu Persetujuan* agar otomatis memfilter dan menampilkan data pengajuan izin dari para pegawai yang berstatus **"Menunggu Persetujuan"**. Kini keduanya berfungsi secara nyata.

### 6. Fitur Persetujuan Izin (Approve/Reject) oleh Admin
*   **Masalah:** Tombol "Review" pada Dashboard salah arah (menuju ke halaman cetak Laporan). Sistem juga tidak memiliki fungsi yang nyata bagi Admin untuk menyetujui atau menolak permohonan izin.
*   **File yang diubah:** `Code.gs`, `assets/js/dashboard.js`, `assets/js/izin.js`
*   **Solusi:** Mengarahkan ulang tombol "Review" di Dashboard agar menuju ke halaman `izin.html`. Halaman `izin.html` dimodifikasi agar berfungsi ganda:
    *   Jika yang membuka adalah **Pegawai**, tabel hanya menampilkan status pengajuan (Menunggu/Disetujui/Ditolak).
    *   Jika yang membuka adalah **Admin**, tabel akan memunculkan tombol aksi **Setujui** (Hijau) dan **Tolak** (Merah) di samping setiap izin yang masih berstatus menunggu. Admin dapat langsung mengklik tombol tersebut dan sistem akan memperbarui *database* (melalui *endpoint* baru `updatePermitStatus`).

### 7. Fitur Deteksi Lokasi Otomatis (Pengaturan Geofencing)
*   **Masalah:** Mengisi koordinat sekolah secara manual (menggeser pin atau mengetik angka) dirasa kurang praktis bagi admin yang sedang berada di lokasi sekolah tersebut.
*   **File yang diubah:** `geofencing.html`, `assets/js/geofence.js`
*   **Solusi:** Menambahkan tombol sekunder **"Dapatkan Lokasi Sekarang"** tepat di atas tombol *Simpan Pengaturan*. Tombol ini akan otomatis meminta akses GPS *browser*, membaca koordinat lokasi Admin saat ini, mengisinya ke kolom Latitude/Longitude, serta menggeser posisi peta (*map*) ke lokasi tersebut seketika.

### 8. Papan Ringkasan Kehadiran Harian (Dashboard)
*   **Masalah:** Grafik Kehadiran Mingguan yang menggunakan garis dinilai kurang informatif untuk pemantauan *real-time* setiap pagi.
*   **File yang diubah:** `dashboard.html`, `assets/js/dashboard.js`
*   **Solusi:** Mengganti secara total kanvas grafik tersebut dengan 4 daftar interaktif (Grid List) bernama **Ringkasan Kehadiran Hari Ini**:
    1.  **Hadir Tepat Waktu:** Menampilkan seluruh pegawai yang sudah absen masuk. 5 pegawai yang melakukan absen paling pagi otomatis mendapatkan *badge* **Top (Ikon Medali)** sebagai bentuk apresiasi (gamifikasi).
    2.  **Terlambat:** Menampilkan pegawai yang jam kedatangannya melewati batas toleransi.
    3.  **Izin / Cuti:** Menampilkan mereka yang sedang menjalani masa izin/cuti khusus pada hari ini saja (berdasarkan rentang tanggal izin).
    4.  **Belum Absen:** Sistem secara otomatis menyilangkan data seluruh pegawai dengan data kehadiran dan izin. Jika ada yang tersisa (tidak hadir dan tidak izin), mereka akan dimasukkan ke daftar Belum Absen/Alpa.

### 9. Menu Riwayat Absensi Khusus Pegawai (Sisi User) & Laporan Kalender Penuh
*   **Masalah:** Pegawai tidak memiliki akses langsung untuk melihat riwayat kehadiran mereka sendiri. Format cetakan sebelumnya juga hanya menampilkan hari saat pegawai absen (tidak berurutan secara kalender penuh).
*   **File yang dibuat/diubah:** `riwayat.html`, `assets/js/riwayat.js`, penyisipan navigasi di seluruh halaman utama.
*   **Solusi:** 
    *   Membuat halaman khusus **Riwayat Absensi** di bawah Modul Absensi yang hanya menampilkan data milik pegawai yang *login*.
    *   Sistem tabel dan cetak PDF kini berubah menjadi **Laporan Kalender Penuh**. Sistem akan meng-*generate* seluruh tanggal dari tanggal 1 sampai akhir bulan.
    *   Sistem melakukan pengecekan berjenjang untuk mendeteksi status per hari: Cek Kehadiran $\rightarrow$ Cek Hari Libur $\rightarrow$ Cek Libur Akhir Pekan (Minggu) $\rightarrow$ Cek Pengajuan Izin/Cuti (Disetujui) $\rightarrow$ Jika tidak ada, di-set sebagai **Alpa / Tidak Hadir**.
    *   Menambahkan kolom **Hari** pada tabel *web* maupun tabel unduhan PDF. Hasil cetak PDF diformat menyerupai surat resmi dengan ruang tanda tangan untuk Kepala Sekolah di sudut kanan bawah.

### 10. Pemisahan Kolom Waktu Absensi (Masuk & Pulang)
*   **Masalah:** Format laporan sebelumnya menggabungkan seluruh aktivitas absen (masuk/pulang) dalam satu kolom secara berderet ke bawah per hari, sehingga tabel menjadi terlalu panjang.
*   **File yang diubah:** `riwayat.html`, `assets/js/riwayat.js`
*   **Solusi:** Merombak struktur generator tabel agar memisahkan waktu absen menjadi dua kolom spesifik: **Absen Masuk** dan **Absen Pulang**. Keterangan status seperti "Hari Libur" atau "Izin/Cuti" akan dicetak melebar membentangi kedua kolom waktu tersebut, membuat laporan menjadi sangat rapi (satu baris per tanggal).

---

## [22 Juli 2026] - Penambalan Celah Keamanan & Pemindahan Logika ke Server

### 11. Perlindungan Akun Admin Utama
*   **Masalah:** Akun admin utama (`admin`) rentan terhapus jika seseorang menembak API penghapusan melalui console, meskipun tombol hapus disembunyikan di antarmuka.
*   **File yang diubah:** `Code.gs`
*   **Solusi:** Menambahkan perlindungan di tingkat server pada *endpoint* `deleteUser`. Jika `payload.username === 'admin'`, server akan langsung menolak dan mengembalikan pesan "Akses Ditolak".

### 12. Pemindahan Logika Kehadiran (Waktu & Jarak) ke Sisi Server
*   **Masalah:** Sistem sangat bergantung pada waktu dan titik GPS dari perangkat klien (HP/Laptop pengguna). Pengguna dapat dengan mudah memanipulasi waktu lokal perangkat (jam) atau menggunakan *Fake GPS* untuk mengelabui jarak (Geofencing) dan status (Tepat Waktu/Terlambat).
*   **File yang diubah:** `Code.gs`, `assets/js/absensi.js`
*   **Solusi:** 
    * Klien (`absensi.js`) tidak lagi melakukan kalkulasi terlambat atau tepat waktu. Klien hanya bertugas mengirimkan status tombol yang ditekan (Masuk/Pulang), lokasi saat ini (Latitude/Longitude), dan foto.
    * Server (`Code.gs`) mengambil alih perhitungan jarak (menggunakan formula *Haversine*) berdasarkan konfigurasi titik koordinat sekolah yang tersimpan di *database*.
    * Server juga menggunakan jam server (Google Servers) dengan zona waktu Asia/Jakarta (GMT+7) untuk menentukan apakah pegawai terlambat, terlalu cepat, atau tepat waktu, dengan mencocokkan jadwal absensi mingguan.

### 13. Perbaikan Bug Timpa-Menimpa Pengumuman (Race Condition)
*   **Masalah:** Pengumuman ditambahkan di klien lalu disatukan ke *array* dan dikirim ulang seluruhnya menimpa konfigurasi *database* (`updateSettings`). Jika ada dua admin yang melakukannya berdekatan waktu, data akan saling menimpa.
*   **File yang diubah:** `Code.gs`, `assets/js/dashboard.js`
*   **Solusi:** Membuat perintah spesifik baru `addAnnouncement` pada `doPost` di `Code.gs`. Admin hanya mengirimkan 1 pengumuman baru ke server. Server yang akan mengambil data lama, menyisipkan data baru, lalu menyimpannya, sehingga risiko timpa-menimpa dapat dihindari.

### 14. Pembaruan Opsi B: Arsitektur Template & Super Admin
*   **Masalah:** Kebutuhan untuk merencanakan pengelolaan banyak sekolah di masa depan membutuhkan fondasi arsitektur "Template" (Opsi B) agar setiap sekolah memiliki profil dan konfigurasi sendiri-sendiri tanpa mencampur data absensi (yang rawan membebani Google Sheets).
*   **File yang diubah:** `Code.gs`, `pengaturan.html`, `assets/js/pengaturan.js`, `assets/js/dashboard.js`, `assets/js/laporan.js`, `assets/js/riwayat.js`
*   **Solusi:**
    *   **Akun Super Admin:** Menambahkan pembuatan akun *default* `superadmin` pada saat inisialisasi *database* pertama kali (`setupDatabase`). Perlindungan *deleteUser* di server juga diperbarui untuk memblokir penghapusan akun `superadmin`.
    *   **Menu Profil Sekolah:** Menambahkan modul *Profil Sekolah* pada halaman Pengaturan (hanya terlihat oleh akun Super Admin). Modul ini mengelola: Nama Sekolah, Alamat, Tingkat Pendidikan, Status, Logo, Kop Surat, Nama Kepsek, dan NIP Kepsek.
    *   **Pengolahan Gambar Base64:** Fitur unggah (Upload) logo dan kop surat diproses secara asinkron menggunakan format `Base64` dari *client* (browser) lalu dikirim ke *endpoint* khusus `updateSchoolProfile` di `Code.gs` untuk dikonversi menjadi *file* dan disimpan di Google Drive.
    *   **Integrasi PDF Dinamis:** *Output* generator cetak PDF pada modul Laporan (`laporan.js`) dan Riwayat (`riwayat.js`) kini me-*load* seluruh konfigurasi nama, logo, kop, dan Tanda Tangan Kepsek secara *real-time* dari *database*.

### 15. Perbaikan Bug Hak Akses Super Admin & Rendering Logo
*   **Masalah:** Saat login menggunakan akun `superadmin`, sistem sebelumnya gagal mendeteksi *role* secara benar, menyebabkan fitur manajemen hilang. Selain itu, gambar logo dan kop surat yang tersimpan di Google Drive tampil patah (broken) baik pada UI maupun pratinjau cetak karena format URL tidak valid untuk elemen gambar, serta masalah perizinan berkas (permissions). Menu "Profil Sekolah" juga belum tersedia di Sidebar navigasi utama.
*   **File yang diubah:** `Code.gs`, `assets/js/auth.js`, `assets/js/app.js`, `assets/js/dashboard.js`, `assets/js/pengaturan.js`, `assets/js/laporan.js`, `assets/js/riwayat.js`, dan 13 file HTML.
*   **Solusi:**
    *   **Perbaikan Role:** Menyesuaikan logika autentikasi di `auth.js` agar langsung mengenali dan menangani peran `superadmin`.
    *   **Injeksi Sidebar Dinamis:** Memasukkan elemen *Profil Sekolah* ke seluruh 13 *file* HTML sebagai menu *sidebar* utama, dilengkapi skrip yang otomatis menyembunyikan/menampilkan fitur tersebut sesuai dengan hak akses (hanya untuk `superadmin`).
    *   **Realtime DOM Update:** Fungsi baru `applySchoolProfile()` di `app.js` ditambahkan. Sekarang nama sekolah dan logo pada Sidebar (semua halaman) maupun layar utama Login akan diperbarui secara otomatis begitu halaman dimuat (dari *localStorage*). Modul Pengaturan juga dipaksa agar selalu merender ulang setelan UI setelah pengguna menekan "Simpan Profil".
    *   **Penanganan URL Gambar Google Drive:** Mengubah sistem pembacaan *Drive ID* menggunakan format URL tipe `thumbnail` agar gambar kebal terhadap pemblokiran pihak ketiga. Komponen cetak Laporan Harian dan Rekapitulasi kini mengeksekusi konversi URL gambar pada logo dan kop surat sebelum merendernya.
    *   **File Permission Override:** Memaksa parameter setSharing `ANYONE_WITH_LINK` (Public View) pada script `Code.gs` saat menyisipkan *blob* logo/kop surat secara langsung ke tiap berkas Google Drive untuk menjamin gambar bisa ditayangkan secara *online* tanpa login akun Google.

---

## [23 Juli 2026] - Peningkatan Keamanan Lanjut & Fitur Rekapitulasi

### 16. Penambalan Celah Eksekusi Lanjut (Keamanan)
*   **Masalah:** Ditemukan kerentanan pada `Code.gs` di mana pengguna dapat memanipulasi *request* dengan menyisipkan struktur yang tidak terduga untuk mencoba mengeksekusi script secara tak terotorisasi (*arbitrary code execution/injection*).
*   **File yang diubah:** `Code.gs`
*   **Solusi:** Memperketat validasi, sanitasi, dan kontrol keamanan pada fungsi `doPost` untuk memblokir pola-pola URL tak terdaftar (yang menolak HTTP `fetch` berbahaya).

### 17. Penambahan Fitur "Laporan Sertifikasi" (Rekapitulasi)
*   **Masalah:** Modul Rekapitulasi hanya memiliki satu jenis tampilan (Rekap Detail), padahal sekolah membutuhkan format "Laporan Sertifikasi" yang menampilkan daftar absensi harian (tanggal 1 s/d 31) secara mendatar.
*   **File yang diubah:** `rekapitulasi.html`, `assets/js/rekapitulasi.js`
*   **Solusi:** Menambahkan form *dropdown* **Jenis Laporan**. Jika "Laporan Sertifikasi" dipilih, sistem akan memuat tabel baru secara otomatis, menghitung tanggal secara kalender penuh, merender huruf (H)adir, (S)akit, (I)zin, (A)lpa, atau (L)ibur untuk masing-masing hari, lalu menambahkan 4 kolom penjumlahan (Total H, S, I, A) di akhir tabel per pegawainya.

### 18. Standardisasi Antarmuka & Logika H.Kerja (Rekapitulasi)
*   **Masalah:** Tabel Laporan Sertifikasi dan Rekap Detail memiliki perbedaan gaya kolom biodata. Selain itu, perhitungan nilai "H.Kerja" pada tabel Rekap Detail sempat terikat/kaku pada angka 22 hari, sehingga total perhitungannya salah/berbeda dengan kalender nyata bulan yang di-filter.
*   **File yang diubah:** `assets/js/rekapitulasi.js`
*   **Solusi:** 
    *   **Antarmuka:** Menyelaraskan struktur header Laporan Sertifikasi agar sama dengan Rekap Detail (menggabungkan Nama/NIP bertumpuk vertikal, menambahkan status warna-warni `badge` pada tipe PNS/PPPK, dan Jabatan).
    *   **Logika H.Kerja:** Menambahkan blok algoritma `calendarDays` ke fungsi Rekap Detail. Sistem kini akan menganalisa pengaturan *Hari Libur (Holidays)* dan konfigurasi *Jam Kerja Mingguan (Weekly Schedule)* untuk menghitung jumlah nyata hari kerja (*working days*) dalam bulan berjalan.

### 19. Penambahan Opsi Jumlah Entri Tampilan (DataTables Pagination)
*   **Masalah:** Daftar pegawai (khususnya untuk sekolah besar) bisa memanjang berhalaman-halaman. Tabel sebelumnya terkunci hanya menampilkan 10 atau 20 baris dan merepotkan admin jika ingin melihat lebih banyak.
*   **File yang diubah:** `assets/js/rekapitulasi.js`
*   **Solusi:** Memodifikasi konfigurasi `dom` milik plugin *DataTables* dan menyisipkan fungsi kontrol `lengthMenu`. Tersedia *dropdown* opsi (10, 25, 50, 100, atau "Semua") agar Admin bisa menentukan berapa jumlah baris data yang tampil di layar dalam sekali lihat. Diletakkan bersebelahan secara rapi dengan tombol Ekspor Laporan.

### 20. Penambahan Fitur Absen Manual (Admin)
*   **Masalah:** Sering terjadi kasus di mana pegawai lupa absen, terlambat secara teknis, atau terjadi kesalahan pemindaian wajah. Admin membutuhkan fitur cadangan untuk memasukkan data absensi secara manual.
*   **File yang dibuat/diubah:** `Code.gs`, `absen-manual.html`, `assets/js/absen-manual.js`, penyisipan navigasi di seluruh halaman utama.
*   **Solusi:** 
    *   Membuat *endpoint* baru di sisi server (`manualAttendance`) yang berfungsi menyuntikkan data kehadiran langsung ke *database* dengan parameter keterangan "Manual (Admin)".
    *   Membuat antarmuka `absen-manual.html` yang dilengkapi validasi hak akses *(Role Admin)*, *dropdown* daftar nama pegawai otomatis, serta *input* status kehadiran (Masuk/Pulang).
    *   Menambahkan tautan **Absen Manual** ke dalam *Sidebar* tepat di bawah menu Data Pegawai yang tampil bagi akun Administrator.

### 21. Perbaikan Bug Ekstraksi Format Jam (Riwayat Absensi & Rekapitulasi)
*   **Masalah:** Jam Masuk dan Jam Pulang di halaman Riwayat Absensi terkadang tidak muncul (hanya menampilkan strip `-`). Ini terjadi karena Google Sheets sering otomatis mem-parsing tanggal+jam yang masuk sebagai *Date Object* sehingga mengubah format teks mentahnya menjadi ISO String (`YYYY-MM-DDTHH:mm:ss.sssZ`).
*   **File yang diubah:** `Code.gs`, `assets/js/riwayat.js`
*   **Solusi:** 
    *   Memperbarui algoritma pembacaan waktu (ekstraksi) pada skrip `riwayat.js` agar menjadi fleksibel (sistem akan secara dinamis mengekstrak jam menggunakan objek *Date* atau pemisahan *String* tergantung format datanya).
    *   Merombak sistem *injector* pada `Code.gs` dengan menambahkan prefix karakter kutip tunggal (`'`) sebelum tanggal disimpan. Ini akan memaksa Google Sheets di kemudian hari untuk selalu mengenali data tanggal/jam secara permanen sebagai karakter *Plain Text*.

### 22. Algoritma Smart Append untuk Mencegah "Jumping Rows" (Google Sheets)
*   **Masalah:** Ditemukan kejadian di mana data absensi masuk ke baris yang jauh di bawah (baris ke-999), melompati ratusan baris kosong di atasnya (mulai baris 58). Ini disebabkan fungsi standar Google Apps Script (`sheet.appendRow`) menganggap baris-baris kosong tersebut masih memiliki format/sisa data dari aktivitas sebelumnya (seperti spasi, format sel, atau penghapusan sel menggunakan tombol *Backspace/Delete*).
*   **File yang diubah:** `Code.gs`
*   **Solusi:**
    *   Membuat fungsi helper baru `smartAppendRow(sheet, rowData)` yang bekerja dengan memindai array di Kolom A (mulai dari baris ke-2 untuk melindungi Header) guna menemukan baris kosong pertama secara akurat.
    *   Mengganti semua penggunaan `sheet.appendRow` pada aksi penambahan data pengguna dan absensi (`addUser`, `submitAttendance`, `manualAttendance`, dan `submitPermit`) dengan `smartAppendRow`. Data yang masuk kini dipastikan akan selalu mengisi baris kosong pertama yang tersedia secara berurutan dan rapi.

### 23. Perbaikan Alur Navigasi & Keamanan Akses "Pengaturan Profil"
*   **Masalah:** Saat pengguna (Pegawai maupun Admin) mengklik opsi "Pengaturan Profil" pada dropdown avatar di pojok kanan atas, sistem malah melompat/membuka halaman `pengaturan.html` yang merupakan halaman **Pengaturan Sistem & Profil Sekolah (Super Admin)**. Selain salah sasaran, halaman pengaturan tersebut sebelumnya juga belum diproteksi dari akses pengguna biasa.
*   **File yang diubah:** `dashboard.html`, `absensi.html`, `assets/js/app.js`, `assets/js/pengaturan.js`, `Code.gs`
*   **Solusi:**
    *   **Modal Profil Saya (Universal):** Mengubah perilaku tautan "Pengaturan Profil" di seluruh aplikasi agar tidak lagi berpindah halaman, melainkan membuka **Modal Profil Saya** (`App.showProfileModal`) yang interaktif dan modern. Modal ini menampilkan Biodata (Nama, NIP/Username, Role Badge, dan Avatar) serta menyediakan opsi pengubahan kata sandi akun secara mandiri.
    *   **Inisialisasi Navigasi (`initUserNav`):** Memperbaiki tampilan avatar di navbar agar inisial gambar yang muncul sesuai dengan nama pengguna yang sedang login (bukan lagi *default hardcoded* "Admin").
    *   **Proteksi Keamanan Halaman (`pengaturan.js` & `app.js`):** Menambahkan verifikasi peran (*Role Security Guard*) pada file `pengaturan.js` dan global `App.init()`. Jika pengguna biasa mencoba mengakses URL halaman admin/pengaturan sistem secara langsung, sistem akan memblokir akses, memberikan pesan peringatan, dan mengarahkan kembali ke Dashboard.
    *   **Endpoint Server Baru (`updateMyProfile`):** Menambahkan fungsi pada server `Code.gs` agar pengguna dapat menyimpan perubahan kata sandi baru mereka secara aman ke dalam Google Sheets tanpa memerlukan hak akses admin global.

### 24. Peningkatan Modal "Profil Saya": Edit Lengkap & Upload Foto Avatar
*   **Masalah:** Pengguna yang sedang aktif (Pegawai/Admin) membutuhkan fleksibilitas untuk mengubah data biodata pribadi mereka (seperti Foto Wajah, Nama, NIP, Pangkat/Golongan, Username, dan Kata Sandi) langsung dari tampilan antarmuka tanpa harus meminta bantuan Admin/Operator.
*   **File yang diubah:** `assets/js/app.js`, `assets/js/auth.js`, `Code.gs`
*   **Solusi:**
    *   **Upload Foto / Avatar Langsung:** Menambahkan tombol "Ganti Foto / Avatar" pada Modal Profil Saya yang dilengkapi validasi ukuran maksimal (5MB) dan pratinjau (*live preview*) instan. Saat disimpan, foto diunggah langsung ke folder Google Drive (`User_Photos`) melalui server Apps Script (`saveBase64ToDrive`) dan URL publiknya disinkronkan ke spreadsheet.
    *   **Edit Form Lengkap:** Mengubah tampilan statis pada modal menjadi form interaktif yang memungkinkan pengguna memperbarui **Nama Lengkap**, **NIP**, **Pangkat/Golongan**, **Username**, dan **Kata Sandi (Password)**.
    *   **Sinkronisasi Real-Time (`getMyProfile`):** Menambahkan *endpoint* baru `getMyProfile` pada `Code.gs`. Setiap kali pengguna membuka Modal Profil Saya, sistem secara otomatis mengambil data profil terbaru dari server dan meng-cache ke dalam `localStorage` (`userData`), memastikan biodata yang ditampilkan selalu mutakhir.
    *   **Keamanan Ganti Akun:** Jika pengguna merubah Username atau Kata Sandi mereka, sistem secara otomatis memberi notifikasi dan mengarahkan pengguna untuk login ulang demi keamanan sesi.

### 25. Auto-Resolusi & Sinkronisasi Riwayat Absensi Saat Ubah Username (Google Sheets)
*   **Masalah:** Saat pengguna (seperti Ainsyah) mengubah Username akun mereka dari NIP (`196909112006042004`) menjadi nama pendek (`Ainsyah`), seluruh riwayat absensi dan izin dari hari-hari sebelumnya seolah-olah hilang dan tidak tampil di halaman Riwayat Absensi / Laporan. Hal ini terjadi karena rekam jejak lama di Google Sheets masih tersimpan mengacu pada Username lama / NIP.
*   **File yang diubah:** `Code.gs`
*   **Solusi:**
    *   **Dynamic Username Resolution & Auto-Migration (`getDatabase`):** Memperbaiki alur pengambilan data pada `getDatabase`. Sistem kini secara pintar memetakan (*mapping*) seluruh catatan absensi dan izin berdasarkan NIP, Nama, maupun Username lama ke Username yang sedang aktif saat ini. Begitu aplikasi dibuka/direfresh, sistem secara otomatis memperbarui (*self-healing / auto-migrate*) sel di spreadsheet Google Sheets yang masih menggunakan NIP/username lama menjadi username baru, sehingga seluruh riwayat kehadiran lama langsung muncul kembali dengan rapi.
    *   **Cascading History Sync (`syncUserHistory`):** Menambahkan fungsi helper `syncUserHistory` yang otomatis dipanggil setiap kali pengguna memperbarui profilnya (`updateMyProfile`) atau saat Admin mengedit data pegawai (`updateUser`). Fungsi ini memastikan integritas relasi database tetap terjaga di seluruh sheet (`Attendance` dan `Permits`).



