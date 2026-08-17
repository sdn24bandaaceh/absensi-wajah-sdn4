document.addEventListener('DOMContentLoaded', () => {
  
  let dbUsers = [];
  let dbAttendance = [];
  let schoolProfile = { nama: 'SDN 24 BANDA ACEH', alamat: 'Jalan Pendidikan No. 12, Banda Aceh', kepsek: 'Nama Kepala Sekolah', nipKepsek: '19700101 200003 1 001', kopSurat: '' };

  // Set default values for inputs
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('dateHarian').value = today;
  document.getElementById('monthBulanan').value = today.slice(0, 7);

  loadData();

  function loadData() {
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(res && res.success) {
        dbUsers = res.data.users;
        dbAttendance = res.data.attendance;
        if(res.data.settings && res.data.settings.SCHOOL_PROFILE) {
          try { schoolProfile = JSON.parse(res.data.settings.SCHOOL_PROFILE); } catch(e){}
        }
        
        // Populate pegawai dropdown
        const selectPegawai = document.getElementById('selectPegawai');
        selectPegawai.innerHTML = '<option value="">Pilih Pegawai...</option>';
        
        dbUsers.forEach(u => {
          if (u.status !== 'Admin' && u.role !== 'Admin') {
             const opt = document.createElement('option');
             opt.value = u.username;
             opt.textContent = u.nama;
             selectPegawai.appendChild(opt);
          }
        });
      }
    });
  }

  // --- Laporan Harian (Cetak Web) ---
  document.getElementById('btnHarian').addEventListener('click', () => {
    const dateVal = document.getElementById('dateHarian').value;
    if(!dateVal) {
      App.showToast('Pilih tanggal terlebih dahulu', 'warning');
      return;
    }
    
    // Filter attendance
    const filtered = dbAttendance.filter(a => {
       const aDate = String(a.timestamp).split(',')[0].split('T')[0];
       return aDate === dateVal;
    });
    
    printHarian(dateVal, filtered);
  });

  // --- Rekap Bulanan (Export CSV) ---
  document.getElementById('btnBulanan').addEventListener('click', () => {
    const monthVal = document.getElementById('monthBulanan').value;
    if(!monthVal) {
      App.showToast('Pilih bulan terlebih dahulu', 'warning');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Username,Nama,Status,Tanggal,Waktu,Keterangan\n";
    
    dbAttendance.forEach(a => {
       const aDateStr = String(a.timestamp).split(',')[0].split('T')[0];
       if(aDateStr.startsWith(monthVal)) {
          const aTime = String(a.timestamp).split(', ')[1] || '';
          const row = [a.username, `"${a.nama}"`, a.status, aDateStr, aTime, `"${a.keterangan || '-'}"`].join(",");
          csvContent += row + "\n";
       }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Absensi_${monthVal}.csv`);
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    App.showToast('CSV berhasil diunduh', 'success');
  });

  // --- Cetak Laporan Per Pegawai ---
  document.getElementById('btnPegawai').addEventListener('click', () => {
    const username = document.getElementById('selectPegawai').value;
    if(!username) {
      App.showToast('Pilih pegawai terlebih dahulu', 'warning');
      return;
    }
    
    const user = dbUsers.find(u => u.username === username);
    const filtered = dbAttendance.filter(a => a.username === username);
    
    printPegawai(user, filtered);
  });

  function printHarian(date, data) {
    let trHtml = '';
    if(data.length === 0) {
      trHtml = '<tr><td colspan="5" style="text-align:center;">Tidak ada data pada tanggal ini.</td></tr>';
    } else {
      data.forEach((d, i) => {
        const time = String(d.timestamp).split(', ')[1] || '-';
        trHtml += `
          <tr>
            <td>${i+1}</td>
            <td>${d.nama}</td>
            <td>${time}</td>
            <td>${d.status}</td>
            <td>${d.keterangan || '-'}</td>
          </tr>
        `;
      });
    }

    const printWin = window.open('', '', 'width=800,height=600');
    printWin.document.write(`
      <html>
        <head>
          <title>Cetak Harian</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h2, h3 { text-align: center; }
            .kop-surat { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #000; padding-bottom: 15px; }
            .kop-surat h2 { margin: 0; font-size: 22px; text-transform: uppercase; }
            .kop-surat p { margin: 5px 0 0 0; font-size: 14px; }
            .ttd-box { float: right; width: 300px; text-align: left; margin-top: 30px; font-size: 14px; }
            .ttd-nama { font-weight: bold; text-decoration: underline; margin-top: 80px; margin-bottom: 2px;}
            .clearfix::after { content: ""; clear: both; display: table; }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            ${schoolProfile.kopSurat ? `<img src="${App.getDirectImageUrl(schoolProfile.kopSurat)}" style="width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 10px;">` : `
            <h2>${schoolProfile.nama}</h2>
            <p>${schoolProfile.alamat}</p>
            `}
          </div>
          <h2>Laporan Absensi Harian</h2>
          <h3>Tanggal: ${date}</h3>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Pegawai</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${trHtml}
            </tbody>
          </table>
          <div class="clearfix">
            <div class="ttd-box">
              <p style="margin:0;">Banda Aceh, ${date}</p>
              <p style="margin:0;">Kepala Sekolah ${schoolProfile.nama},</p>
              
              <p class="ttd-nama">${schoolProfile.kepsek}</p>
              <p style="margin:0;">NIP. ${schoolProfile.nipKepsek || '-'}</p>
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function(){ window.print(); window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  function printPegawai(user, data) {
    let trHtml = '';
    if(data.length === 0) {
      trHtml = '<tr><td colspan="4" style="text-align:center;">Tidak ada data.</td></tr>';
    } else {
      data.forEach((d, i) => {
        trHtml += `
          <tr>
            <td>${i+1}</td>
            <td>${String(d.timestamp)}</td>
            <td>${d.status}</td>
            <td>${d.keterangan || '-'}</td>
          </tr>
        `;
      });
    }

    const printWin = window.open('', '', 'width=800,height=600');
    printWin.document.write(`
      <html>
        <head>
          <title>Cetak Riwayat Pegawai</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h2, p { text-align: center; }
            .kop-surat { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #000; padding-bottom: 15px; }
            .kop-surat h2 { margin: 0; font-size: 22px; text-transform: uppercase; }
            .kop-surat p { margin: 5px 0 0 0; font-size: 14px; }
            .ttd-box { float: right; width: 300px; text-align: left; margin-top: 30px; font-size: 14px; }
            .ttd-nama { font-weight: bold; text-decoration: underline; margin-top: 80px; margin-bottom: 2px;}
            .clearfix::after { content: ""; clear: both; display: table; }
          </style>
        </head>
        <body>
          <div class="kop-surat">
            ${schoolProfile.kopSurat ? `<img src="${App.getDirectImageUrl(schoolProfile.kopSurat)}" style="width: 100%; max-height: 120px; object-fit: contain; margin-bottom: 10px;">` : `
            <h2>${schoolProfile.nama}</h2>
            <p>${schoolProfile.alamat}</p>
            `}
          </div>
          <h2>Riwayat Absensi Pegawai</h2>
          <p><strong>Nama:</strong> ${user.nama} | <strong>NIP:</strong> ${user.nip || '-'}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Waktu</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${trHtml}
            </tbody>
          </table>
          <div class="clearfix">
            <div class="ttd-box">
              <p style="margin:0;">Banda Aceh, ${new Date().toISOString().split('T')[0]}</p>
              <p style="margin:0;">Kepala Sekolah ${schoolProfile.nama},</p>
              
              <p class="ttd-nama">${schoolProfile.kepsek}</p>
              <p style="margin:0;">NIP. ${schoolProfile.nipKepsek || '-'}</p>
            </div>
          </div>
          <script>
            window.onload = function() { 
              setTimeout(function(){ window.print(); window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }
});
