/**
 * Sistem Absensi Wajah SDN 4 Banda Aceh
 * Google Apps Script Backend (Code.gs)
 */

// Nama-nama sheet yang digunakan sebagai database
const SHEET_USERS = "Users";
const SHEET_ATTENDANCE = "Attendance";
const SHEET_PERMITS = "Permits";
const SHEET_SETTINGS = "Settings";

/**
 * Fungsi untuk menginisialisasi database pada Spreadsheet
 * Jalankan fungsi ini HANYA SEKALI saat pertama kali deploy.
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Setup Sheet Users
  let sheetUsers = ss.getSheetByName(SHEET_USERS);
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet(SHEET_USERS);
  }
  
  // Headers untuk Users
  const userHeaders = ["Foto", "Nama", "NIP", "Pangkat", "Jabatan", "Status", "Username", "Password", "Role"];
  sheetUsers.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
  
  // Format tampilan Header Users
  formatHeader(sheetUsers, userHeaders.length);

  // Sisipkan satu data Admin default jika belum ada data
  if (sheetUsers.getLastRow() === 1) {
    sheetUsers.appendRow([
      "https://placehold.co/100x100/3b82f6/white?text=Admin", 
      "Hidayat, S.Pd., M.Pd.", 
      "19790220 200504 1 001", 
      "Pembina Tk.I, IV/b", 
      "Kepala Sekolah", 
      "PNS", 
      "admin", 
      "admin2026", 
      "Admin"
    ]);
  }

  // 2. Setup Sheet Attendance (Absensi)
  let sheetAttendance = ss.getSheetByName(SHEET_ATTENDANCE);
  if (!sheetAttendance) {
    sheetAttendance = ss.insertSheet(SHEET_ATTENDANCE);
  }
  
  // Headers untuk Attendance
  const attendanceHeaders = ["Timestamp", "Username", "Nama", "Status", "Keterangan", "Jarak", "Photo"];
  sheetAttendance.getRange(1, 1, 1, attendanceHeaders.length).setValues([attendanceHeaders]);
  formatHeader(sheetAttendance, attendanceHeaders.length);

  // 3. Setup Sheet Permits (Izin)
  let sheetPermits = ss.getSheetByName(SHEET_PERMITS);
  if (!sheetPermits) {
    sheetPermits = ss.insertSheet(SHEET_PERMITS);
  }
  
  // Headers untuk Permits
  const permitHeaders = ["ID", "Username", "Nama", "Tipe", "Tanggal Mulai", "Tanggal Selesai", "Alasan", "Status Persetujuan", "File Data", "File Name"];
  sheetPermits.getRange(1, 1, 1, permitHeaders.length).setValues([permitHeaders]);
  formatHeader(sheetPermits, permitHeaders.length);

  // 4. Setup Sheet Settings (Pengaturan)
  let sheetSettings = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheetSettings) {
    sheetSettings = ss.insertSheet(SHEET_SETTINGS);
  }
  
  const settingsHeaders = ["Key", "Value"];
  sheetSettings.getRange(1, 1, 1, settingsHeaders.length).setValues([settingsHeaders]);
  formatHeader(sheetSettings, settingsHeaders.length);

  // Inisialisasi nilai default jika masih kosong
  if (sheetSettings.getLastRow() === 1) {
    const defaultSchedule = {
      1: { entryStart: "07:00", entryEnd: "08:00", exitStart: "14:00", exitEnd: "15:00" },
      2: { entryStart: "07:00", entryEnd: "08:00", exitStart: "14:00", exitEnd: "15:00" },
      3: { entryStart: "07:00", entryEnd: "08:00", exitStart: "14:00", exitEnd: "15:00" },
      4: { entryStart: "07:00", entryEnd: "08:00", exitStart: "14:00", exitEnd: "15:00" },
      5: { entryStart: "07:00", entryEnd: "07:45", exitStart: "11:30", exitEnd: "12:30" },
      6: { entryStart: "07:30", entryEnd: "08:30", exitStart: "13:00", exitEnd: "14:00" },
      0: { entryStart: "00:00", entryEnd: "00:00", exitStart: "00:00", exitEnd: "00:00" }
    };
    
    sheetSettings.appendRow(["SCHOOL_LAT", "'5.5414"]);
    sheetSettings.appendRow(["SCHOOL_LNG", "'95.3146"]);
    sheetSettings.appendRow(["MAX_RADIUS_METERS", "100"]);
    sheetSettings.appendRow(["WEEKLY_SCHEDULE", JSON.stringify(defaultSchedule)]);
  }

  Logger.log("Database berhasil disetup! Silakan lanjutkan dengan menyiapkan endpoint doPost / doGet.");
}

/**
 * Fungsi utilitas untuk memformat header sheet agar lebih rapi (bold, background color)
 */
function formatHeader(sheet, numCols) {
  const range = sheet.getRange(1, 1, 1, numCols);
  range.setFontWeight("bold");
  range.setBackground("#4c1130"); // Warna gelap
  range.setFontColor("#ffffff"); // Teks putih
  sheet.setFrozenRows(1); // Freeze baris pertama agar selalu terlihat
  sheet.autoResizeColumns(1, numCols); // Sesuaikan ukuran kolom otomatis
}

/**
 * Handle HTTP GET Requests
 * Melayani aksi "login" dan "getDatabase"
 */
function doGet(e) {
  // Set output agar mengembalikan format JSON
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    const action = e.parameter.action;
    
    // --- 1. AKSI: LOGIN ---
    if (action === "login") {
      const username = e.parameter.username;
      const password = e.parameter.password;
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheetUsers = ss.getSheetByName(SHEET_USERS);
      const data = sheetUsers.getDataRange().getValues();
      
      // Melewati baris pertama (header)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        // Index urutan: Foto(0), Nama(1), NIP(2), Pangkat(3), Jabatan(4), Status(5), Username(6), Password(7), Role(8)
        
        if (row[6] === username && row[7] === password) {
          const userObj = {
            foto: row[0],
            nama: row[1],
            nip: row[2],
            pangkat: row[3],
            jabatan: row[4],
            status: row[5],
            username: row[6],
            role: row[8]
          };
          
          return output.setContent(JSON.stringify({
            success: true,
            user: userObj
          }));
        }
      }
      
      // Jika username/password tidak cocok
      return output.setContent(JSON.stringify({
        success: false,
        message: "Username atau password salah!"
      }));
    }
    
    // --- 2. AKSI: GET DATABASE (Sync Realtime) ---
    if (action === "getDatabase") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // Ambil data Users
      const usersData = ss.getSheetByName(SHEET_USERS).getDataRange().getValues();
      const users = usersData.slice(1).map(row => ({
        foto: row[0], nama: row[1], nip: row[2], pangkat: row[3],
        jabatan: row[4], status: row[5], username: row[6], password: row[7], role: row[8]
      }));
      
      // Ambil data Attendance (Absensi)
      const attendanceData = ss.getSheetByName(SHEET_ATTENDANCE).getDataRange().getValues();
      const attendance = attendanceData.slice(1).map(row => ({
        timestamp: row[0], username: row[1], nama: row[2], status: row[3],
        keterangan: row[4], jarak: row[5], photo: row[6]
      }));
      
      // Ambil data Permits (Izin)
      const permitsData = ss.getSheetByName(SHEET_PERMITS).getDataRange().getValues();
      const permits = permitsData.slice(1).map(row => ({
        id: row[0], username: row[1], nama: row[2], tipe: row[3],
        tanggalMulai: row[4], tanggalSelesai: row[5], alasan: row[6],
        status: row[7], fileData: row[8], fileName: row[9]
      }));
      
      // Ambil data Settings
      const settingsData = ss.getSheetByName(SHEET_SETTINGS).getDataRange().getValues();
      const settings = {};
      for (let i = 1; i < settingsData.length; i++) {
        settings[settingsData[i][0]] = settingsData[i][1];
      }
      
      return output.setContent(JSON.stringify({
        success: true,
        data: {
          users: users,
          attendance: attendance,
          permits: permits,
          settings: settings
        }
      }));
    }
    
    // --- AKSI: DEFAULT ---
    return output.setContent(JSON.stringify({
      success: true,
      message: "Backend Aplikasi Absensi Wajah SDN 4 berfungsi dengan baik!"
    }));
    
  } catch (error) {
    return output.setContent(JSON.stringify({
      success: false,
      message: "Terjadi kesalahan pada server: " + error.toString()
    }));
  }
}

/**
 * Handle HTTP POST Requests
 * Melayani aksi CRUD User, Absensi, dan Pengajuan Izin
 */
function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // Mem-parsing payload yang dikirim dari frontend (fetch method POST)
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // --- AKSI: TAMBAH USER (addUser) ---
    if (action === "addUser") {
      const sheet = ss.getSheetByName(SHEET_USERS);
      
      // Cek apakah username sudah ada
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][6] === payload.username) {
          return output.setContent(JSON.stringify({ success: false, message: "Username sudah digunakan!" }));
        }
      }

      sheet.appendRow([
        payload.foto || "",
        payload.nama || "",
        payload.nip || "",
        payload.pangkat || "",
        payload.jabatan || "",
        payload.status || "",
        payload.username || "",
        payload.password || "",
        payload.role || "Peserta"
      ]);
      return output.setContent(JSON.stringify({ success: true, message: "Pengguna berhasil ditambahkan." }));
    }

    // --- AKSI: UPDATE USER (updateUser) ---
    if (action === "updateUser") {
      const sheet = ss.getSheetByName(SHEET_USERS);
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (data[i][6] === payload.username) {
          foundIndex = i + 1; // Baris spreadsheet dimulai dari 1
          break;
        }
      }

      if (foundIndex !== -1) {
        // Update baris: Foto(1), Nama(2), NIP(3), Pangkat(4), Jabatan(5), Status(6), Username(7), Password(8), Role(9)
        const rowRange = sheet.getRange(foundIndex, 1, 1, 9);
        rowRange.setValues([[
          payload.foto || "",
          payload.nama || "",
          payload.nip || "",
          payload.pangkat || "",
          payload.jabatan || "",
          payload.status || "",
          payload.username || "",
          payload.password || "",
          payload.role || "Peserta"
        ]]);
        return output.setContent(JSON.stringify({ success: true, message: "Data pengguna berhasil diperbarui." }));
      } else {
        return output.setContent(JSON.stringify({ success: false, message: "Pengguna tidak ditemukan." }));
      }
    }

    // --- AKSI: DELETE USER (deleteUser) ---
    if (action === "deleteUser") {
      const sheet = ss.getSheetByName(SHEET_USERS);
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][6] === payload.username) {
          sheet.deleteRow(i + 1);
          return output.setContent(JSON.stringify({ success: true, message: "Pengguna berhasil dihapus." }));
        }
      }
      return output.setContent(JSON.stringify({ success: false, message: "Pengguna tidak ditemukan." }));
    }

    // --- AKSI: SUBMIT ATTENDANCE (submitAttendance) ---
    if (action === "submitAttendance") {
      const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
      const now = new Date();
      // Format tanggal yang rapi
      const timestamp = now.toISOString().slice(0, 10) + ", " + now.toLocaleTimeString('id-ID');
      
      let photoUrl = payload.photo || "";
      if (photoUrl.startsWith("data:image")) {
         const fileName = "Absen_" + (payload.username || payload.user_id || "User") + "_" + now.getTime() + ".png";
         photoUrl = saveBase64ToDrive(photoUrl, "Absensi_Photos_SDN4", fileName);
      }
      
      sheet.appendRow([
        timestamp,
        payload.username || payload.user_id || "",
        payload.nama || "",
        payload.status || "",
        payload.keterangan || "-", // Keterangan tambahan (Tepat Waktu/Terlambat)
        payload.jarak || "",
        photoUrl
      ]);
      return output.setContent(JSON.stringify({ success: true, message: "Absensi berhasil dicatat." }));
    }

    // --- AKSI: SUBMIT PERMIT (submitPermit) ---
    if (action === "submitPermit") {
      const sheet = ss.getSheetByName(SHEET_PERMITS);
      // Auto-increment ID sederhana
      const newId = sheet.getLastRow(); 
      
      let fileUrl = payload.fileData || "";
      if (fileUrl.startsWith("data:")) {
         const fileName = "Izin_" + (payload.username || "User") + "_" + new Date().getTime();
         fileUrl = saveBase64ToDrive(fileUrl, "Izin_Files_SDN4", payload.fileName || fileName);
      }

      sheet.appendRow([
        newId,
        payload.username || "",
        payload.nama || "",
        payload.tipe || "",
        payload.mulai || "",
        payload.selesai || "",
        payload.alasan || "",
        "Menunggu Persetujuan",
        fileUrl,
        payload.fileName || ""
      ]);
      return output.setContent(JSON.stringify({ success: true, message: "Pengajuan izin berhasil dikirim." }));
    }
    
    // --- AKSI: UPDATE SETTINGS (updateSettings) ---
    if (action === "updateSettings") {
      const sheet = ss.getSheetByName(SHEET_SETTINGS);
      const data = sheet.getDataRange().getValues();
      const keysToUpdate = Object.keys(payload.settings || {});
      
      // Update nilai jika key sudah ada
      for (let i = 1; i < data.length; i++) {
        const key = data[i][0];
        if (keysToUpdate.includes(key)) {
          let val = payload.settings[key];
          // Tambahkan tanda kutip satu untuk koordinat agar Google Sheets tidak mengubah format angkanya
          if (key === 'SCHOOL_LAT' || key === 'SCHOOL_LNG') {
            val = "'" + val; 
          }
          sheet.getRange(i + 1, 2).setValue(val);
          // Hapus key dari daftar yang perlu ditambahkan
          const index = keysToUpdate.indexOf(key);
          if (index > -1) {
            keysToUpdate.splice(index, 1);
          }
        }
      }
      
      // Jika ada key baru yang belum ada di sheet, tambahkan
      keysToUpdate.forEach(key => {
        let val = payload.settings[key];
        if (key === 'SCHOOL_LAT' || key === 'SCHOOL_LNG') {
          val = "'" + val;
        }
        sheet.appendRow([key, val]);
      });
      
      return output.setContent(JSON.stringify({ success: true, message: "Pengaturan sistem berhasil diperbarui." }));
    }

    return output.setContent(JSON.stringify({ success: false, message: "Aksi tidak dikenali." }));

  } catch (error) {
    return output.setContent(JSON.stringify({ success: false, message: "Terjadi kesalahan server: " + error.toString() }));
  }
}

/**
 * Menyimpan data Base64 ke dalam folder Google Drive
 * @param {string} base64Data - String base64 (format: data:image/png;base64,...)
 * @param {string} folderName - Nama folder utama (misal: Absensi_Photos)
 * @param {string} fileName - Nama file yang akan disimpan
 * @returns {string} URL public dari file yang disimpan
 */
function saveBase64ToDrive(base64Data, folderName, fileName) {
  try {
    // Memisahkan header MIME type dari data base64 sebenarnya
    const dataParts = base64Data.split(',');
    const mimeString = dataParts[0].split(':')[1].split(';')[0];
    const encodedData = dataParts[1] || dataParts[0];
    
    // Mendekode base64 menjadi blob
    const decoded = Utilities.base64Decode(encodedData);
    const blob = Utilities.newBlob(decoded, mimeString, fileName);
    
    // Mencari atau membuat folder utama
    let folders = DriveApp.getFoldersByName(folderName);
    let targetFolder;
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.createFolder(folderName);
      // Membuat folder bisa diakses publik (View Only)
      targetFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    // Menyimpan file ke dalam folder
    const file = targetFolder.createFile(blob);
    
    // Mengembalikan URL download / view file
    return file.getUrl();
  } catch (error) {
    Logger.log("Error saving to Drive: " + error.toString());
    return "";
  }
}
