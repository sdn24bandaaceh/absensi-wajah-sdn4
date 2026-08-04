/**
 * Sistem Absensi Wajah SDN 4 Banda Aceh
 * Google Apps Script Backend (Code.gs)
 */

// Nama-nama sheet yang digunakan sebagai database
const SHEET_USERS = "Users";
const SHEET_ATTENDANCE = "Attendance";
const SHEET_PERMITS = "Permits";
const SHEET_SETTINGS = "Settings";
const SHEET_TUGAS_LUAR = "Tugas_Luar";

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
  const userHeaders = ["Foto", "Nama", "NIP", "Pangkat", "Jabatan", "Status", "Username", "Password", "Role", "Pesan Blokir"];
  sheetUsers.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
  
  // Format tampilan Header Users
  formatHeader(sheetUsers, userHeaders.length);

  // Sisipkan data default jika belum ada data
  if (sheetUsers.getLastRow() === 1) {
    sheetUsers.appendRow([
      "https://placehold.co/100x100/dc2626/white?text=Super", 
      "Super Administrator", 
      "-", 
      "-", 
      "Pemilik Sistem", 
      "superadmin", 
      "super2026", 
      "superadmin",
      ""
    ]);
    sheetUsers.appendRow([
      "https://placehold.co/100x100/3b82f6/white?text=Admin", 
      "Hidayat, S.Pd., M.Pd.", 
      "19790220 200504 1 001", 
      "Pembina Tk.I, IV/b", 
      "Kepala Sekolah", 
      "admin", 
      "admin2026", 
      "admin",
      ""
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

  // 5. Setup Sheet Tugas Luar
  let sheetTugasLuar = ss.getSheetByName(SHEET_TUGAS_LUAR);
  if (!sheetTugasLuar) {
    sheetTugasLuar = ss.insertSheet(SHEET_TUGAS_LUAR);
  }
  
  // Headers untuk Tugas Luar
  const tugasLuarHeaders = ["ID", "Nama Tugas", "Latitude", "Longitude", "Radius", "Tanggal Mulai", "Tanggal Selesai", "Pegawai"];
  sheetTugasLuar.getRange(1, 1, 1, tugasLuarHeaders.length).setValues([tugasLuarHeaders]);
  formatHeader(sheetTugasLuar, tugasLuarHeaders.length);

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
    
    const defaultHolidays = [
      { date: '2026-01-01', name: 'Tahun Baru Masehi', type: 'Nasional' },
      { date: '2026-08-17', name: 'Hari Kemerdekaan RI', type: 'Nasional' }
    ];
    sheetSettings.appendRow(["HOLIDAYS", JSON.stringify(defaultHolidays)]);
    
    const defaultProfile = {
      nama: 'SD Negeri 4 Banda Aceh',
      alamat: 'Jl. Contoh Alamat No. 123, Banda Aceh',
      tingkat: 'SD',
      status: 'Negeri',
      logo: '',
      kepsek: 'Hidayat, S.Pd., M.Pd.',
      nipKepsek: '19790220 200504 1 001',
      kopSurat: ''
    };
    sheetSettings.appendRow(["SCHOOL_PROFILE", JSON.stringify(defaultProfile)]);
    
    const defaultAppConfig = {
      liveness: true,
      multiDevice: false,
      threshold: 0.7
    };
    sheetSettings.appendRow(["APP_CONFIG", JSON.stringify(defaultAppConfig)]);
    
    const defaultAnnouncements = [
      { id: 1, title: 'Rapat Evaluasi Bulanan', content: 'Diharapkan kehadiran seluruh dewan guru pada hari Jumat, pukul 14:00 WIB di Ruang Rapat.', type: 'info', date: new Date().toISOString() },
      { id: 2, title: 'Pembaruan Sistem', content: 'Aplikasi Absensi Wajah telah diperbarui ke versi Enterprise 2026. Mohon izinkan akses lokasi dan kamera.', type: 'success', date: new Date().toISOString() }
    ];
    sheetSettings.appendRow(["ANNOUNCEMENTS", JSON.stringify(defaultAnnouncements)]);
  }

  Logger.log("Database berhasil disetup! Silakan lanjutkan dengan menyiapkan endpoint doPost / doGet.");
}

/**
 * Fungsi utilitas untuk membuat akun Super Admin secara paksa
 * Jalankan fungsi ini jika Anda sudah memiliki data pegawai sebelumnya 
 * namun belum memiliki akun superadmin.
 */
function createSuperAdmin() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetUsers = ss.getSheetByName(SHEET_USERS);
  
  if (!sheetUsers) {
    Logger.log("Error: Sheet Users tidak ditemukan. Jalankan setupDatabase() terlebih dahulu.");
    return;
  }
  
  // Cek apakah superadmin sudah ada
  const data = sheetUsers.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === 'superadmin') {
      Logger.log("Akun superadmin sudah ada di dalam database.");
      return;
    }
  }
  
  // Jika belum ada, tambahkan
  sheetUsers.appendRow([
    "https://placehold.co/100x100/dc2626/white?text=Super", 
    "Super Administrator", 
    "-", 
    "-", 
    "Pemilik Sistem", 
    "superadmin", 
    "super2026", 
    "superadmin",
    ""
  ]);
  
  Logger.log("Akun superadmin berhasil ditambahkan!");
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
        
        const dbUsername = String(row[6] || "").trim();
        const dbNip = String(row[2] || "").replace(/\s/g, "");
        const inputUsername = String(username || "").replace(/\s/g, "");
        const inputPassword = String(password || "");
        const dbPassword = String(row[7] || "");
        
        if ((dbUsername === inputUsername || dbNip === inputUsername) && dbPassword === inputPassword) {
          const userObj = {
            foto: row[0],
            nama: row[1],
            nip: row[2],
            pangkat: row[3],
            jabatan: row[4],
            status: row[5],
            username: row[6],
            role: row[8].toLowerCase(),
            pesanBlokir: row[9] || ""
          };
          let schoolProfile = {};
          const sheetSettings = ss.getSheetByName(SHEET_SETTINGS);
          if (sheetSettings) {
            const settingsData = sheetSettings.getDataRange().getValues();
            for (let j = 1; j < settingsData.length; j++) {
              if (settingsData[j][0] === 'SCHOOL_PROFILE') {
                try { schoolProfile = JSON.parse(settingsData[j][1]); } catch(e){}
                break;
              }
            }
          }
          
          // Generate simple token for admin authorization
          let adminToken = "";
          if (userObj.role === 'admin' || userObj.role === 'superadmin') {
            const dateStr = Utilities.formatDate(new Date(), "GMT", "yyyyMMdd");
            adminToken = Utilities.base64Encode(username + "_ADMIN_" + dateStr);
          }
          
          return output.setContent(JSON.stringify({
            success: true,
            user: userObj,
            schoolProfile: schoolProfile,
            adminToken: adminToken
          }));
        }
      }
      
      // Jika username/password tidak cocok
      return output.setContent(JSON.stringify({
        success: false,
        message: "Username atau password salah!"
      }));
    }
    
    // --- 2. AKSI: GET DATABASE (Sync Realtime & Auto-Migration) ---
    if (action === "getDatabase") {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      // Ambil data Users
      const usersData = ss.getSheetByName(SHEET_USERS).getDataRange().getValues();
      const users = usersData.slice(1).map(row => ({
        foto: row[0], nama: row[1], nip: row[2], pangkat: row[3],
        jabatan: row[4], status: row[5], username: row[6], role: row[8],
        pesanBlokir: row[9] || ""
      }));
      
      // Pemetaan ID pengguna (Username, NIP, Nama) ke Username dan Nama resmi saat ini
      const userMap = {};
      const nameToOfficial = {};
      users.forEach(u => {
        const officialUname = String(u.username || "").trim();
        const officialNama = String(u.nama || "").trim();
        if (officialUname) {
          userMap[officialUname.toLowerCase()] = { username: officialUname, nama: officialNama };
          if (u.nip && String(u.nip).trim() !== "") {
            userMap[String(u.nip).trim().toLowerCase()] = { username: officialUname, nama: officialNama };
          }
          if (officialNama !== "") {
            nameToOfficial[officialNama.toLowerCase()] = { username: officialUname, nama: officialNama };
          }
        }
      });
      
      // Ambil data Attendance (Absensi) dengan auto-sync & resolusi username
      const sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
      const attendanceData = sheetAtt.getDataRange().getValues();
      let attNeedsUpdate = false;
      
      const attendance = attendanceData.slice(1).map((row, idx) => {
        const attUname = String(row[1] || "").trim();
        const attNama = String(row[2] || "").trim();
        let resolvedUname = attUname;
        let resolvedNama = attNama;
        
        const mapped = userMap[attUname.toLowerCase()] || nameToOfficial[attNama.toLowerCase()];
        if (mapped) {
          if (mapped.username !== attUname || (mapped.nama !== "" && mapped.nama !== attNama)) {
            resolvedUname = mapped.username;
            if (mapped.nama !== "") resolvedNama = mapped.nama;
            attendanceData[idx + 1][1] = resolvedUname;
            attendanceData[idx + 1][2] = resolvedNama;
            attNeedsUpdate = true;
          }
        }
        return {
          timestamp: row[0], username: resolvedUname, nama: resolvedNama, status: row[3],
          keterangan: row[4], jarak: row[5], photo: row[6]
        };
      });
      
      if (attNeedsUpdate && attendanceData.length > 1) {
        try {
          sheetAtt.getRange(1, 1, attendanceData.length, attendanceData[0].length).setValues(attendanceData);
        } catch(e) { Logger.log("Auto-sync att error: " + e); }
      }
      
      // Ambil data Permits (Izin) dengan auto-sync & resolusi username
      const sheetPermits = ss.getSheetByName(SHEET_PERMITS);
      const permitsData = sheetPermits.getDataRange().getValues();
      let permNeedsUpdate = false;
      
      const permits = permitsData.slice(1).map((row, idx) => {
        const permUname = String(row[1] || "").trim();
        const permNama = String(row[2] || "").trim();
        let resolvedUname = permUname;
        let resolvedNama = permNama;
        
        const mapped = userMap[permUname.toLowerCase()] || nameToOfficial[permNama.toLowerCase()];
        if (mapped) {
          if (mapped.username !== permUname || (mapped.nama !== "" && mapped.nama !== permNama)) {
            resolvedUname = mapped.username;
            if (mapped.nama !== "") resolvedNama = mapped.nama;
            permitsData[idx + 1][1] = resolvedUname;
            permitsData[idx + 1][2] = resolvedNama;
            permNeedsUpdate = true;
          }
        }
        return {
          id: row[0], username: resolvedUname, nama: resolvedNama, tipe: row[3],
          tanggalMulai: row[4], tanggalSelesai: row[5], alasan: row[6],
          status: row[7], fileData: row[8], fileName: row[9]
        };
      });
      
      if (permNeedsUpdate && permitsData.length > 1) {
        try {
          sheetPermits.getRange(1, 1, permitsData.length, permitsData[0].length).setValues(permitsData);
        } catch(e) { Logger.log("Auto-sync perm error: " + e); }
      }
      
      // Ambil data Settings
      const settingsData = ss.getSheetByName(SHEET_SETTINGS).getDataRange().getValues();
      const settings = {};
      for (let i = 1; i < settingsData.length; i++) {
        settings[settingsData[i][0]] = settingsData[i][1];
      }
      // Ambil data Tugas Luar
      const sheetTugasLuar = ss.getSheetByName(SHEET_TUGAS_LUAR);
      let tugasLuar = [];
      if (sheetTugasLuar) {
        const tlData = sheetTugasLuar.getDataRange().getValues();
        tugasLuar = tlData.slice(1).map(row => ({
          id: row[0],
          namaTugas: row[1],
          lat: row[2],
          lng: row[3],
          radius: row[4],
          tanggalMulai: row[5],
          tanggalSelesai: row[6],
          pegawai: (row[7] ? row[7].toString().split(',') : [])
        }));
      }
      
      return output.setContent(JSON.stringify({
        success: true,
        data: {
          users: users,
          attendance: attendance,
          permits: permits,
          settings: settings,
          tugasLuar: tugasLuar
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

    // Helper function to verify admin token
    function verifyAdminToken(username, token) {
      if (!username || !token) return false;
      const today = Utilities.formatDate(new Date(), "GMT", "yyyyMMdd");
      const yesterday = Utilities.formatDate(new Date(new Date().getTime() - 86400000), "GMT", "yyyyMMdd");
      const expectedToken1 = Utilities.base64Encode(username + "_ADMIN_" + today);
      const expectedToken2 = Utilities.base64Encode(username + "_ADMIN_" + yesterday);
      return token === expectedToken1 || token === expectedToken2;
    }

    // List of actions that require admin authorization
    const adminActions = ["addUser", "updateUser", "deleteUser", "updateSettings", "updateSchoolProfile", "addAnnouncement", "updatePermitStatus", "manualAttendance", "addTugasLuar", "updateTugasLuar", "deleteTugasLuar"];
    
    if (adminActions.includes(action)) {
      if (!verifyAdminToken(payload.requestUserId, payload.adminToken)) {
        return output.setContent(JSON.stringify({ success: false, message: "Akses Ditolak: Memerlukan otorisasi admin atau sesi telah kedaluwarsa." }));
      }
    }

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

      smartAppendRow(sheet, [
        payload.foto || "",
        payload.nama || "",
        payload.nip || "",
        payload.pangkat || "",
        payload.jabatan || "",
        payload.status || "",
        payload.username || "",
        payload.password || "",
        payload.role || "Peserta",
        payload.pesanBlokir || ""
      ]);
      return output.setContent(JSON.stringify({ success: true, message: "Pengguna berhasil ditambahkan." }));
    }

    // --- AKSI: UPDATE USER (updateUser) ---
    if (action === "updateUser") {
      const sheet = ss.getSheetByName(SHEET_USERS);
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (data[i][6] === payload.username || (payload.oldUsername && data[i][6] === payload.oldUsername)) {
          foundIndex = i + 1; // Baris spreadsheet dimulai dari 1
          break;
        }
      }

      if (foundIndex !== -1) {
        const oldRow = sheet.getRange(foundIndex, 1, 1, 9).getValues()[0];
        const oldUname = oldRow[6];
        const newUname = payload.username || oldUname;
        const newNama = payload.nama !== undefined && payload.nama !== null ? payload.nama : oldRow[1];
        const newNip = payload.nip !== undefined && payload.nip !== null ? payload.nip : oldRow[2];

        const rowRange = sheet.getRange(foundIndex, 1, 1, 10);
        rowRange.setValues([[
          payload.foto !== undefined && payload.foto !== null ? payload.foto : oldRow[0],
          newNama,
          newNip,
          payload.pangkat !== undefined && payload.pangkat !== null ? payload.pangkat : oldRow[3],
          payload.jabatan !== undefined && payload.jabatan !== null ? payload.jabatan : oldRow[4],
          payload.status !== undefined && payload.status !== null ? payload.status : oldRow[5],
          newUname,
          payload.password !== undefined && payload.password !== null && String(payload.password).trim() !== "" ? payload.password : oldRow[7],
          payload.role !== undefined && payload.role !== null ? payload.role : oldRow[8],
          payload.pesanBlokir !== undefined ? payload.pesanBlokir : (oldRow[9] || "")
        ]]);
        
        syncUserHistory(oldUname, newUname, newNip, newNama);
        return output.setContent(JSON.stringify({ success: true, message: "Data pengguna berhasil diperbarui." }));
      } else {
        return output.setContent(JSON.stringify({ success: false, message: "Pengguna tidak ditemukan." }));
      }
    }

    // --- AKSI: UPDATE PROFIL SAYA (updateMyProfile) ---
    if (action === "updateMyProfile") {
      const searchUsername = payload.oldUsername || payload.username;
      if (!searchUsername) {
        return output.setContent(JSON.stringify({ success: false, message: "Username diperlukan." }));
      }
      const sheet = ss.getSheetByName(SHEET_USERS);
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][6]).toLowerCase() === String(searchUsername).toLowerCase()) {
          foundIndex = i + 1;
          break;
        }
      }

      if (foundIndex !== -1) {
        // Cek jika ganti username dan apakah username baru sudah terpakai
        const newUname = payload.newUsername || payload.username || searchUsername;
        if (String(newUname).toLowerCase() !== String(searchUsername).toLowerCase()) {
          for (let i = 1; i < data.length; i++) {
            if ((i + 1) !== foundIndex && String(data[i][6]).toLowerCase() === String(newUname).toLowerCase()) {
              return output.setContent(JSON.stringify({ success: false, message: "Username baru sudah digunakan oleh pengguna lain!" }));
            }
          }
        }

        // Handle upload foto jika berupa base64
        let fotoUrl = data[foundIndex - 1][0];
        if (payload.foto !== undefined && payload.foto !== null && String(payload.foto).trim() !== "") {
          const fotoStr = String(payload.foto).trim();
          if (fotoStr.startsWith("data:image/")) {
            const uploadedUrl = saveBase64ToDrive(fotoStr, "User_Photos", "avatar_" + newUname + "_" + new Date().getTime() + ".jpg");
            if (uploadedUrl && uploadedUrl !== "") {
              fotoUrl = uploadedUrl;
            }
          } else {
            fotoUrl = fotoStr;
          }
          sheet.getRange(foundIndex, 1).setValue(fotoUrl);
        }

        if (payload.nama !== undefined && payload.nama !== null) {
          sheet.getRange(foundIndex, 2).setValue(payload.nama);
        }
        if (payload.nip !== undefined && payload.nip !== null) {
          sheet.getRange(foundIndex, 3).setValue(payload.nip);
        }
        if (payload.pangkat !== undefined && payload.pangkat !== null) {
          sheet.getRange(foundIndex, 4).setValue(payload.pangkat);
        }
        if (newUname && newUname !== "") {
          sheet.getRange(foundIndex, 7).setValue(newUname);
        }
        if (payload.password && String(payload.password).trim() !== "") {
          sheet.getRange(foundIndex, 8).setValue(payload.password.trim());
        }

        // Ambil data terbaru untuk dikembalikan ke frontend
        const updatedRow = sheet.getRange(foundIndex, 1, 1, 9).getValues()[0];
        const updatedUser = {
          foto: updatedRow[0],
          nama: updatedRow[1],
          nip: updatedRow[2],
          pangkat: updatedRow[3],
          jabatan: updatedRow[4],
          status: updatedRow[5],
          username: updatedRow[6],
          role: String(updatedRow[8]).toLowerCase()
        };
        
        // Sinkronisasi riwayat absensi dan izin ke username/nama baru
        syncUserHistory(searchUsername, updatedRow[6], updatedRow[2], updatedRow[1]);

        return output.setContent(JSON.stringify({
          success: true,
          message: "Profil berhasil diperbarui.",
          user: updatedUser
        }));
      } else {
        return output.setContent(JSON.stringify({ success: false, message: "Pengguna tidak ditemukan." }));
      }
    }

    // --- AKSI: GET PROFIL SAYA (getMyProfile) ---
    if (action === "getMyProfile") {
      const uname = e.parameter.username || payload.username;
      if (!uname) {
        return output.setContent(JSON.stringify({ success: false, message: "Username diperlukan." }));
      }
      const sheet = ss.getSheetByName(SHEET_USERS);
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][6]).toLowerCase() === String(uname).toLowerCase()) {
          const userObj = {
            foto: data[i][0],
            nama: data[i][1],
            nip: data[i][2],
            pangkat: data[i][3],
            jabatan: data[i][4],
            status: data[i][5],
            username: data[i][6],
            role: String(data[i][8]).toLowerCase()
          };
          return output.setContent(JSON.stringify({ success: true, user: userObj }));
        }
      }
      return output.setContent(JSON.stringify({ success: false, message: "Pengguna tidak ditemukan." }));
    }

    // --- AKSI: DELETE USER (deleteUser) ---
    if (action === "deleteUser") {
      if (payload.username === 'admin' || payload.username === 'superadmin') {
        return output.setContent(JSON.stringify({ success: false, message: "Akses Ditolak: Akun utama tidak dapat dihapus." }));
      }
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
      // 1. Cek apakah user sedang diblokir
      const sheetUsers = ss.getSheetByName(SHEET_USERS);
      if (sheetUsers) {
        const usersData = sheetUsers.getDataRange().getValues();
        for (let i = 1; i < usersData.length; i++) {
          if (usersData[i][6] === (payload.username || payload.user_id)) {
            if (usersData[i][9] && String(usersData[i][9]).trim() !== "") {
              return output.setContent(JSON.stringify({ 
                success: false, 
                message: "Akses Absensi Diblokir: " + usersData[i][9] 
              }));
            }
            break;
          }
        }
      }

      const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
      const sheetSettings = ss.getSheetByName(SHEET_SETTINGS);
      const settingsData = sheetSettings.getDataRange().getValues();
      
      // Kalkulasi Waktu Server (GMT+7)
      const serverTimeStr = new Date().toLocaleString("en-US", {timeZone: "Asia/Jakarta"});
      const serverDate = new Date(serverTimeStr);
      const todayIso = serverDate.getFullYear() + "-" + String(serverDate.getMonth()+1).padStart(2, '0') + "-" + String(serverDate.getDate()).padStart(2, '0');
      
      // Mencegah input ganda (dobel) untuk user biasa
      const dataAtt = sheet.getDataRange().getValues();
      for (let i = 1; i < dataAtt.length; i++) {
        if (dataAtt[i][1] === (payload.username || payload.user_id || "")) {
          if (dataAtt[i][3] === (payload.status || "")) {
            const rowDate = dataAtt[i][0] ? String(dataAtt[i][0]).split(',')[0].replace("'", "").split('T')[0] : "";
            if (rowDate === todayIso) {
              return output.setContent(JSON.stringify({ success: false, message: "Anda sudah melakukan absensi " + payload.status + " hari ini!" }));
            }
          }
        }
      }
      
      let schoolLat = 5.5414;
      let schoolLng = 95.3146;
      let maxRadius = 100;
      let weeklySchedule = null;
      let holidays = [];
      
      for (let i = 1; i < settingsData.length; i++) {
        const key = settingsData[i][0];
        const val = settingsData[i][1];
        if (key === 'SCHOOL_LAT') schoolLat = parseFloat(val.toString().replace("'", ""));
        if (key === 'SCHOOL_LNG') schoolLng = parseFloat(val.toString().replace("'", ""));
        if (key === 'MAX_RADIUS_METERS') maxRadius = parseInt(val);
        if (key === 'WEEKLY_SCHEDULE') {
          try { weeklySchedule = JSON.parse(val); } catch(e) {}
        }
        if (key === 'HOLIDAYS') {
          try { holidays = JSON.parse(val); } catch(e) {}
        }
      }
      
      // Hitung Jarak (Server-side Haversine Formula)
      let calculatedDistance = "Tidak diketahui";
      let isOutsideRadius = false;
      if (payload.userLat && payload.userLng) {
        const r = 6371e3; // Radius bumi dalam meter
        const lat1 = schoolLat * Math.PI/180;
        const lat2 = payload.userLat * Math.PI/180;
        const deltaLat = (payload.userLat - schoolLat) * Math.PI/180;
        const deltaLng = (payload.userLng - schoolLng) * Math.PI/180;
        
        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = r * c;
        calculatedDistance = Math.round(distance) + "m";
        if (distance > maxRadius) {
          isOutsideRadius = true;
        }
      }
      
      // Kalkulasi Waktu Server (GMT+7)
      // (Variabel serverTimeStr, serverDate, todayIso sudah dideklarasikan di awal)
      const dayOfWeek = serverDate.getDay();
      const currentMins = serverDate.getHours() * 60 + serverDate.getMinutes();
      const currentTimeStr = String(serverDate.getHours()).padStart(2, '0') + ":" + String(serverDate.getMinutes()).padStart(2, '0') + ":" + String(serverDate.getSeconds()).padStart(2, '0');
      const timestamp = "'" + todayIso + ", " + currentTimeStr;

      let isTugasLuarActive = false;
      let namaTugasLuar = "";

      // Jika di luar sekolah, cek apakah ada Tugas Luar yang aktif untuk pengguna ini
      if (isOutsideRadius && payload.userLat && payload.userLng) {
        const sheetTugas = ss.getSheetByName(SHEET_TUGAS_LUAR);
        if (sheetTugas) {
          const tugasData = sheetTugas.getDataRange().getValues();
          for (let i = 1; i < tugasData.length; i++) {
            let tglMulaiStr = "";
            let tglSelesaiStr = "";
            try {
               tglMulaiStr = (tugasData[i][5] instanceof Date) ? Utilities.formatDate(tugasData[i][5], "Asia/Jakarta", "yyyy-MM-dd") : String(tugasData[i][5]).split('T')[0];
               tglSelesaiStr = (tugasData[i][6] instanceof Date) ? Utilities.formatDate(tugasData[i][6], "Asia/Jakarta", "yyyy-MM-dd") : String(tugasData[i][6]).split('T')[0];
            } catch(e) {}
            
            if (todayIso >= tglMulaiStr && todayIso <= tglSelesaiStr) {
              const pegawaiArr = (tugasData[i][7] ? tugasData[i][7].toString().split(',') : []);
              const uname = payload.username || payload.user_id || "";
              
              if (pegawaiArr.includes(uname)) {
                const tLat = parseFloat(tugasData[i][2].toString().replace("'", ""));
                const tLng = parseFloat(tugasData[i][3].toString().replace("'", ""));
                const tRad = parseInt(tugasData[i][4]);
                
                const r = 6371e3;
                const lat1 = tLat * Math.PI/180;
                const lat2 = payload.userLat * Math.PI/180;
                const deltaLat = (payload.userLat - tLat) * Math.PI/180;
                const deltaLng = (payload.userLng - tLng) * Math.PI/180;
                
                const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                          Math.cos(lat1) * Math.cos(lat2) *
                          Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distanceTL = r * c;
                
                if (distanceTL <= tRad) {
                  isOutsideRadius = false;
                  isTugasLuarActive = true;
                  calculatedDistance = Math.round(distanceTL) + "m";
                  namaTugasLuar = tugasData[i][1];
                  break;
                }
              }
            }
          }
        }
      }

      if (isOutsideRadius) {
        return output.setContent(JSON.stringify({ success: false, message: "Gagal: Lokasi Anda (" + calculatedDistance + ") di luar radius sekolah dan tidak ada jadwal penugasan luar." }));
      }
      
      
      // Cek Libur
      let isHoliday = false;
      for (const hol of holidays) {
        const hStart = hol.startDate || hol.date;
        const hEnd = hol.endDate || hStart;
        if (todayIso >= hStart && todayIso <= hEnd) {
          isHoliday = true;
          break;
        }
      }
      
      // Tentukan Keterangan
      let keterangan = "Tepat Waktu";
      if (isHoliday) {
        keterangan = "Hari Libur";
      } else if (weeklySchedule && weeklySchedule[dayOfWeek]) {
        const scheduleToday = weeklySchedule[dayOfWeek];
        if (scheduleToday.entryStart === "00:00" && scheduleToday.entryEnd === "00:00") {
          keterangan = "Hari Libur";
        } else {
          if (payload.status === 'Masuk') {
            const startParts = (scheduleToday.entryStart || '00:00').split(':');
            const endParts = (scheduleToday.entryEnd || '00:00').split(':');
            const tolMins = parseInt(scheduleToday.entryTol || 0);
            const startM = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const endM = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            
            if (currentMins < startM) keterangan = "Terlalu Cepat";
            else if (currentMins > endM + tolMins) keterangan = "Terlambat";
          } else if (payload.status === 'Pulang') {
            const startParts = (scheduleToday.exitStart || '00:00').split(':');
            const endParts = (scheduleToday.exitEnd || '00:00').split(':');
            const tolMins = parseInt(scheduleToday.exitTol || 0);
            const startM = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            const endM = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            
            if (currentMins < startM) keterangan = "Pulang Cepat";
            else if (currentMins > endM + tolMins) keterangan = "Terlambat Pulang";
          }
        }
      }
      
      let photoUrl = payload.photo || "";
      if (photoUrl.startsWith("data:image")) {
         const fileName = "Absen_" + (payload.username || payload.user_id || "User") + "_" + serverDate.getTime() + ".png";
         photoUrl = saveBase64ToDrive(photoUrl, "Absensi_Photos_SDN4", fileName);
      }
      
      if (isTugasLuarActive) {
         calculatedDistance = calculatedDistance + " (Tugas: " + namaTugasLuar + ")";
      }
      
      smartAppendRow(sheet, [
        timestamp,
        payload.username || payload.user_id || "",
        payload.nama || "",
        payload.status || "",
        keterangan,
        calculatedDistance,
        photoUrl
      ]);
      return output.setContent(JSON.stringify({ success: true, message: "Absensi berhasil dicatat." }));
    }

    // --- AKSI: MANUAL ATTENDANCE (manualAttendance) ---
    if (action === "manualAttendance") {
      const sheet = ss.getSheetByName(SHEET_ATTENDANCE);
      
      const payloadDate = payload.date; // YYYY-MM-DD
      const payloadTime = payload.time; // HH:MM
      const timestamp = "'" + payloadDate + ", " + payloadTime + ":00";
      const keterangan = payload.keterangan || "Absen Manual (Admin)";
      
      // Mencegah input ganda (dobel) atau meminta konfirmasi Edit
      let existingRowIndex = -1;
      const dataAtt = sheet.getDataRange().getValues();
      for (let i = 1; i < dataAtt.length; i++) {
        if (dataAtt[i][1] === (payload.username || "")) {
          if (dataAtt[i][3] === (payload.status || "")) {
            const rowDate = dataAtt[i][0] ? String(dataAtt[i][0]).split(',')[0].replace("'", "").split('T')[0] : "";
            if (rowDate === payloadDate) {
              existingRowIndex = i + 1; // baris di Google Sheets dimulai dari 1
              break;
            }
          }
        }
      }
      
      if (existingRowIndex !== -1) {
        if (payload.forceEdit) {
          // Edit jam absensi dan keterangan di baris yang sudah ada
          sheet.getRange(existingRowIndex, 1).setValue(timestamp);
          sheet.getRange(existingRowIndex, 5).setValue(keterangan);
          sheet.getRange(existingRowIndex, 6).setValue("Manual (Admin)");
          return output.setContent(JSON.stringify({ success: true, message: "Jam absensi " + payload.status + " manual berhasil diperbarui." }));
        } else {
          // Kembalikan peringatan untuk minta konfirmasi
          return output.setContent(JSON.stringify({ 
            success: false, 
            requireConfirmation: true, 
            message: "Absensi " + payload.status + " untuk pegawai ini pada tanggal tersebut sudah ada!" 
          }));
        }
      }
      
      smartAppendRow(sheet, [
        timestamp,
        payload.username || "",
        payload.nama || "",
        payload.status || "", // Masuk / Pulang
        keterangan,
        "Manual (Admin)",
        "N/A"
      ]);
      return output.setContent(JSON.stringify({ success: true, message: "Absensi manual berhasil disimpan." }));
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

      smartAppendRow(sheet, [
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
    
    // --- AKSI: UPDATE PERMIT STATUS (updatePermitStatus) ---
    if (action === "updatePermitStatus") {
      const sheet = ss.getSheetByName(SHEET_PERMITS);
      const data = sheet.getDataRange().getValues();
      const targetId = parseInt(payload.id);
      
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (parseInt(data[i][0]) === targetId) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex !== -1) {
        sheet.getRange(foundIndex, 8).setValue(payload.status);
        return output.setContent(JSON.stringify({ success: true, message: "Status izin berhasil diperbarui." }));
      } else {
        return output.setContent(JSON.stringify({ success: false, message: "Data izin tidak ditemukan." }));
      }
    }

    // --- AKSI: ADD ANNOUNCEMENT (addAnnouncement) ---
    if (action === "addAnnouncement") {
      const sheet = ss.getSheetByName(SHEET_SETTINGS);
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;
      let announcements = [];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === 'ANNOUNCEMENTS') {
          foundIndex = i + 1;
          try {
            announcements = JSON.parse(data[i][1]);
          } catch(e) {}
          break;
        }
      }
      
      const newItem = {
        title: payload.title,
        content: payload.content,
        type: payload.type,
        date: new Date().toISOString()
      };
      
      announcements.unshift(newItem); // Tambah ke paling atas
      
      if (foundIndex !== -1) {
        sheet.getRange(foundIndex, 2).setValue(JSON.stringify(announcements));
      } else {
        sheet.appendRow(['ANNOUNCEMENTS', JSON.stringify(announcements)]);
      }
      
      return output.setContent(JSON.stringify({ success: true, message: "Pengumuman berhasil ditambahkan." }));
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

    // --- AKSI: UPDATE SCHOOL PROFILE (updateSchoolProfile) ---
    if (action === "updateSchoolProfile") {
      const sheet = ss.getSheetByName(SHEET_SETTINGS);
      const data = sheet.getDataRange().getValues();
      let foundIndex = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === 'SCHOOL_PROFILE') {
          foundIndex = i + 1;
          break;
        }
      }
      
      let profile = payload.profile;
      
      // Save logo if base64
      if (profile.logo && profile.logo.startsWith("data:image")) {
         profile.logo = saveBase64ToDrive(profile.logo, "Pengaturan_Sekolah", "Logo_" + new Date().getTime() + ".png");
      }
      
      // Save kopSurat if base64
      if (profile.kopSurat && profile.kopSurat.startsWith("data:image")) {
         profile.kopSurat = saveBase64ToDrive(profile.kopSurat, "Pengaturan_Sekolah", "Kop_" + new Date().getTime() + ".png");
      }
      
      if (foundIndex !== -1) {
        sheet.getRange(foundIndex, 2).setValue(JSON.stringify(profile));
      } else {
        sheet.appendRow(['SCHOOL_PROFILE', JSON.stringify(profile)]);
      }
      
      return output.setContent(JSON.stringify({ success: true, message: "Profil sekolah berhasil diperbarui." }));
    }

    // --- AKSI: ADD TUGAS LUAR (addTugasLuar) ---
    if (action === "addTugasLuar") {
      const sheet = ss.getSheetByName(SHEET_TUGAS_LUAR);
      const newId = new Date().getTime().toString();
      const pegawaiStr = Array.isArray(payload.pegawai) ? payload.pegawai.join(',') : payload.pegawai;
      
      smartAppendRow(sheet, [
        newId,
        payload.namaTugas || "",
        "'" + (payload.lat || ""),
        "'" + (payload.lng || ""),
        payload.radius || 100,
        payload.tanggalMulai || "",
        payload.tanggalSelesai || "",
        pegawaiStr || ""
      ]);
      return output.setContent(JSON.stringify({ success: true, message: "Tugas Luar berhasil ditambahkan." }));
    }

    // --- AKSI: UPDATE TUGAS LUAR (updateTugasLuar) ---
    if (action === "updateTugasLuar") {
      const sheet = ss.getSheetByName(SHEET_TUGAS_LUAR);
      const data = sheet.getDataRange().getValues();
      const targetId = String(payload.id);
      
      let foundIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === targetId) {
          foundIndex = i + 1;
          break;
        }
      }
      
      if (foundIndex !== -1) {
        const pegawaiStr = Array.isArray(payload.pegawai) ? payload.pegawai.join(',') : payload.pegawai;
        sheet.getRange(foundIndex, 2, 1, 7).setValues([[
          payload.namaTugas,
          "'" + payload.lat,
          "'" + payload.lng,
          payload.radius,
          payload.tanggalMulai,
          payload.tanggalSelesai,
          pegawaiStr
        ]]);
        return output.setContent(JSON.stringify({ success: true, message: "Tugas Luar berhasil diperbarui." }));
      } else {
        return output.setContent(JSON.stringify({ success: false, message: "Tugas Luar tidak ditemukan." }));
      }
    }

    // --- AKSI: DELETE TUGAS LUAR (deleteTugasLuar) ---
    if (action === "deleteTugasLuar") {
      const sheet = ss.getSheetByName(SHEET_TUGAS_LUAR);
      const data = sheet.getDataRange().getValues();
      const targetId = String(payload.id);
      
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === targetId) {
          sheet.deleteRow(i + 1);
          return output.setContent(JSON.stringify({ success: true, message: "Tugas Luar berhasil dihapus." }));
        }
      }
      return output.setContent(JSON.stringify({ success: false, message: "Tugas Luar tidak ditemukan." }));
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
    
    // Pastikan file itu sendiri bisa diakses publik
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Mengembalikan URL download / view file
    return file.getUrl();
  } catch (error) {
    Logger.log("Error saving to Drive: " + error.toString());
    return "";
  }
}

/**
 * Smart Append: Menambahkan baris baru pada baris kosong pertama di Kolom A
 * untuk mencegah fenomena 'Jumping Rows' akibat sisa format atau sel kosong di baris bawah.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Lembar kerja tujuan
 * @param {Array} rowData - Array data yang akan disisipkan
 */
function smartAppendRow(sheet, rowData) {
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.appendRow(rowData);
    return;
  }
  const colA = sheet.getRange(1, 1, lastRow, 1).getValues();
  let targetRow = lastRow + 1;
  // Mulai dari i = 1 (Baris ke-2) untuk melindungi baris ke-1 (Header)
  for (let i = 1; i < colA.length; i++) {
    const val = colA[i][0];
    if (val === "" || val === null || String(val).trim() === "") {
      targetRow = i + 1;
      break;
    }
  }
  sheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
}

/**
 * Sinkronisasi Username dan Nama pada tabel Attendance dan Permits
 * Memastikan riwayat absensi dan izin tetap terhubung meskipun Username atau Nama diubah.
 * @param {string} oldUsername - Username lama (sebelum diubah)
 * @param {string} newUsername - Username baru (aktif saat ini)
 * @param {string} nip - NIP pengguna
 * @param {string} nama - Nama lengkap pengguna
 */
function syncUserHistory(oldUsername, newUsername, nip, nama) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const oldU = String(oldUsername || "").trim().toLowerCase();
    const newU = String(newUsername || "").trim();
    const newULow = newU.toLowerCase();
    const nipStr = String(nip || "").trim().toLowerCase();
    const namaStr = String(nama || "").trim().toLowerCase();
    
    if (!newU) return;

    // 1. Sync Sheet Attendance
    const sheetAtt = ss.getSheetByName(SHEET_ATTENDANCE);
    if (sheetAtt) {
      const lastRow = sheetAtt.getLastRow();
      if (lastRow > 1) {
        const range = sheetAtt.getRange(1, 1, lastRow, sheetAtt.getLastColumn());
        const data = range.getValues();
        let hasChanged = false;

        for (let i = 1; i < data.length; i++) {
          const attUname = String(data[i][1] || "").trim();
          const attUnameLow = attUname.toLowerCase();
          const attNama = String(data[i][2] || "").trim().toLowerCase();

          let isMatch = false;
          if (oldU && attUnameLow === oldU) isMatch = true;
          else if (attUnameLow === newULow) isMatch = true;
          else if (nipStr && nipStr !== "" && attUnameLow === nipStr) isMatch = true;
          else if (namaStr && namaStr !== "" && attNama === namaStr) isMatch = true;

          if (isMatch) {
            if (attUname !== newU || (nama && String(data[i][2]) !== nama)) {
              data[i][1] = newU;
              if (nama) data[i][2] = nama;
              hasChanged = true;
            }
          }
        }

        if (hasChanged) {
          range.setValues(data);
        }
      }
    }

    // 2. Sync Sheet Permits
    const sheetPermits = ss.getSheetByName(SHEET_PERMITS);
    if (sheetPermits) {
      const lastRow = sheetPermits.getLastRow();
      if (lastRow > 1) {
        const range = sheetPermits.getRange(1, 1, lastRow, sheetPermits.getLastColumn());
        const data = range.getValues();
        let hasChanged = false;

        for (let i = 1; i < data.length; i++) {
          const permUname = String(data[i][1] || "").trim();
          const permUnameLow = permUname.toLowerCase();
          const permNama = String(data[i][2] || "").trim().toLowerCase();

          let isMatch = false;
          if (oldU && permUnameLow === oldU) isMatch = true;
          else if (permUnameLow === newULow) isMatch = true;
          else if (nipStr && nipStr !== "" && permUnameLow === nipStr) isMatch = true;
          else if (namaStr && namaStr !== "" && permNama === namaStr) isMatch = true;

          if (isMatch) {
            if (permUname !== newU || (nama && String(data[i][2]) !== nama)) {
              data[i][1] = newU;
              if (nama) data[i][2] = nama;
              hasChanged = true;
            }
          }
        }

        if (hasChanged) {
          range.setValues(data);
        }
      }
    }
  } catch (error) {
    Logger.log("Error syncUserHistory: " + error.toString());
  }
}
