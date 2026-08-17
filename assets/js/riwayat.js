document.addEventListener('DOMContentLoaded', () => {
  // Verifikasi login
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (isLoggedIn !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  const currentUser = localStorage.getItem('userId');
  const userRole = localStorage.getItem('userRole') || 'pegawai';

  // Sembunyikan menu admin jika pegawai
  if (userRole === 'pegawai') {
    hideAdminMenus();
  }

  // Set default nilai filter ke bulan saat ini
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7);
  document.getElementById('filterBulan').value = currentMonth;

  let allAttendance = [];
  let allPermits = [];
  let holidays = [];
  let schoolProfile = { nama: 'SDN 24 BANDA ACEH', alamat: 'Jalan Pendidikan No. 12, Banda Aceh', kepsek: 'Nama Kepala Sekolah', nipKepsek: '19700101 200003 1 001', kopSurat: '' };

  // Muat Data
  App.fetchAPI('getDatabase', {}, 'GET').then(res => {
    if (res && res.success) {
      // Simpan data
      allAttendance = res.data.attendance.filter(a => a.username === currentUser);
      
      // Ambil izin cuti user ini yang sudah disetujui
      if (res.data.permits) {
        allPermits = res.data.permits.filter(p => p.username === currentUser && p.status === 'Disetujui');
      }

      // Ambil hari libur
      if (res.data.settings && res.data.settings.HOLIDAYS) {
        try {
          holidays = JSON.parse(res.data.settings.HOLIDAYS);
        } catch(e) {
          holidays = [];
        }
      }

      // Ambil Profil Sekolah
      if (res.data.settings && res.data.settings.SCHOOL_PROFILE) {
        try {
          schoolProfile = JSON.parse(res.data.settings.SCHOOL_PROFILE);
        } catch(e) {}
      }

      // Render pertama kali (berdasarkan bulan ini)
      applyFilterAndRender();
    }
  });

  // Tombol Terapkan Filter
  document.getElementById('btnTerapkanFilter').addEventListener('click', () => {
    applyFilterAndRender();
  });

  // Tombol Cetak PDF
  document.getElementById('btnCetakPdf').addEventListener('click', () => {
    const { calendarData, periodeLabel } = getCalendarData();
    if (calendarData.length === 0) {
      App.showToast('Tidak ada rentang tanggal yang valid.', 'warning');
      return;
    }
    cetakRiwayat(calendarData, periodeLabel);
  });

  function applyFilterAndRender() {
    const { calendarData } = getCalendarData();
    renderTable(calendarData);
  }

  // Logika Generator Kalender
  function getCalendarData() {
    const filterBulan = document.getElementById('filterBulan').value;
    const filterMulai = document.getElementById('filterMulai').value;
    const filterSelesai = document.getElementById('filterSelesai').value;

    let startDateStr = '';
    let endDateStr = '';
    let periodeLabel = '';

    if (filterMulai && filterSelesai) {
      startDateStr = filterMulai;
      endDateStr = filterSelesai;
      periodeLabel = `${formatTanggal(filterMulai)} - ${formatTanggal(filterSelesai)}`;
    } else if (filterBulan) {
      // Dapatkan hari pertama dan terakhir bulan
      const [year, month] = filterBulan.split('-');
      startDateStr = `${year}-${month}-01`;
      
      const lastDay = new Date(year, parseInt(month), 0).getDate();
      endDateStr = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
      
      const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      periodeLabel = `${namaBulan[parseInt(month)-1]} ${year}`;
    } else {
      return { calendarData: [], periodeLabel: '' };
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // Pastikan valid
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return { calendarData: [], periodeLabel: periodeLabel };
    }

    const calendarData = [];

    // Loop per hari
    let current = new Date(start);
    while (current <= end) {
      const dateIso = current.toISOString().split('T')[0];
      const hariInt = current.getDay();
      
      // Cari absen di tanggal ini
      const absensiHariIni = allAttendance.filter(a => {
        const aDate = a.timestamp.split(',')[0].split('T')[0];
        return aDate === dateIso;
      });

      if (absensiHariIni.length > 0) {
        let wMasuk = '-';
        let wPulang = '-';
        let ketMasuk = '';
        let ketPulang = '';

        absensiHariIni.forEach(a => {
          let timePart = '-';
          if (a.timestamp && typeof a.timestamp === 'string') {
            if (a.timestamp.includes(', ')) {
              timePart = a.timestamp.split(', ')[1];
            } else if (a.timestamp.includes('T')) {
              try {
                const d = new Date(a.timestamp);
                timePart = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
              } catch(e) {
                timePart = a.timestamp.split('T')[1].slice(0, 8);
              }
            } else if (a.timestamp.includes(' ')) {
              timePart = a.timestamp.split(' ')[1];
            } else {
              timePart = a.timestamp;
            }
          } else if (a.timestamp) {
             try {
                const d = new Date(a.timestamp);
                timePart = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
             } catch(e) {}
          }

          if (a.status === 'Masuk') {
            wMasuk = timePart;
            ketMasuk = a.keterangan || '';
          } else if (a.status === 'Pulang') {
            wPulang = timePart;
            ketPulang = a.keterangan || '';
          }
        });
        
        let ketFinal = ketMasuk;
        if (ketPulang && ketPulang !== ketMasuk) {
          ketFinal += (ketFinal ? ' / ' : '') + ketPulang;
        }

        calendarData.push({
          date: dateIso,
          absenMasuk: wMasuk,
          absenPulang: wPulang,
          keterangan: ketFinal || 'Hadir',
          isReal: true
        });
      } else {
        // Tidak absen, cek berjenjang
        
        // 1. Cek Libur Nasional
        let isLibur = false;
        let liburName = '';
        for (const hol of holidays) {
          const holStart = hol.startDate || hol.date;
          const holEnd = hol.endDate || holStart;
          if (dateIso >= holStart && dateIso <= holEnd) {
            isLibur = true;
            liburName = hol.name;
            break;
          }
        }

        if (isLibur) {
          calendarData.push({
            date: dateIso,
            absenMasuk: 'Hari Libur',
            absenPulang: 'Hari Libur',
            keterangan: liburName,
            isReal: false
          });
        } 
        // 2. Cek Akhir Pekan (Minggu = 0)
        else if (hariInt === 0) {
          calendarData.push({
            date: dateIso,
            absenMasuk: 'Hari Libur',
            absenPulang: 'Hari Libur',
            keterangan: 'Libur Akhir Pekan',
            isReal: false
          });
        }
        // 3. Cek Izin / Cuti
        else {
          let izinItem = null;
          for (const p of allPermits) {
            if (dateIso >= p.tanggalMulai && dateIso <= p.tanggalSelesai) {
              izinItem = p;
              break;
            }
          }

          if (izinItem) {
            const ket = izinItem.alasan ? `${izinItem.tipe} - ${izinItem.alasan}` : izinItem.tipe;
            calendarData.push({
              date: dateIso,
              absenMasuk: 'Izin/Cuti',
              absenPulang: 'Izin/Cuti',
              keterangan: ket,
              isReal: false
            });
          }
          // 4. Alpa
          else {
            calendarData.push({
              date: dateIso,
              absenMasuk: 'Alpa / Tidak Hadir',
              absenPulang: 'Alpa / Tidak Hadir',
              keterangan: '-',
              isReal: false
            });
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return { calendarData, periodeLabel };
  }

  // Fungsi Render Tabel HTML
  function renderTable(data) {
    const tbody = document.getElementById('riwayatBody');
    if (data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Tidak ada data untuk dirender.</td></tr>';
      return;
    }

    let html = '';
    data.forEach((d, i) => {
      const hariName = getNamaHari(d.date);

      let renderMasuk = d.absenMasuk;
      let renderPulang = d.absenPulang;
      
      if (d.isReal) {
         renderMasuk = d.absenMasuk !== '-' ? `<span class="badge bg-success"><i class="bi bi-box-arrow-in-right me-1"></i> ${d.absenMasuk}</span>` : '-';
         renderPulang = d.absenPulang !== '-' ? `<span class="badge bg-primary"><i class="bi bi-box-arrow-left me-1"></i> ${d.absenPulang}</span>` : '-';
      } else {
         let badgeColor = 'secondary';
         if (d.absenMasuk.includes('Alpa')) badgeColor = 'danger';
         if (d.absenMasuk.includes('Izin')) badgeColor = 'info text-dark';
         if (d.absenMasuk.includes('Libur')) badgeColor = 'warning text-dark';
         
         renderMasuk = `<span class="badge bg-${badgeColor}">${d.absenMasuk}</span>`;
         renderPulang = `<span class="badge bg-${badgeColor}">${d.absenPulang}</span>`;
      }

      html += `
        <tr>
          <td>${i + 1}</td>
          <td>${hariName}</td>
          <td>${d.date}</td>
          <td>${renderMasuk}</td>
          <td>${renderPulang}</td>
          <td>${d.keterangan}</td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  // Fungsi Cetak (Print ke PDF browser)
  function cetakRiwayat(data, periodeLabel) {
    const namaPegawai = localStorage.getItem('userName') || 'Pegawai';
    const hariIni = formatTanggal(new Date().toISOString().split('T')[0]);

    let trHtml = '';
    data.forEach((d, i) => {
      const hariName = getNamaHari(d.date);
      
      trHtml += `
        <tr>
          <td style="text-align:center;">${i+1}</td>
          <td>${hariName}</td>
          <td>${d.date}</td>
          <td style="text-align:center;">${d.absenMasuk}</td>
          <td style="text-align:center;">${d.absenPulang}</td>
          <td>${d.keterangan}</td>
        </tr>
      `;
    });

    const printWin = window.open('', '', 'width=900,height=700');
    printWin.document.write(`
      <html>
        <head>
          <title>Riwayat Absensi - ${namaPegawai}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #000; }
            .kop-surat { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #000; padding-bottom: 15px; }
            .kop-surat h2 { margin: 0; font-size: 22px; text-transform: uppercase; }
            .kop-surat p { margin: 5px 0 0 0; font-size: 14px; }
            .judul-laporan { text-align: center; margin: 20px 0; font-size: 16px; font-weight: bold; text-decoration: underline; }
            .info-pegawai { margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th, td { border: 1px solid #000; padding: 8px; }
            th { background-color: #f2f2f2; text-align: center; font-weight:bold; }
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
          
          <div class="judul-laporan">LAPORAN RIWAYAT ABSENSI PEGAWAI</div>
          
          <table class="info-pegawai" style="width:50%; border:none; margin-bottom:20px;">
            <tr><td style="border:none; padding:3px; width:100px;">Nama</td><td style="border:none; padding:3px;">: <strong>${namaPegawai}</strong></td></tr>
            <tr><td style="border:none; padding:3px;">Periode</td><td style="border:none; padding:3px;">: ${periodeLabel}</td></tr>
          </table>

          <table>
            <thead>
              <tr>
                <th style="width: 5%;">No</th>
                <th style="width: 10%;">Hari</th>
                <th style="width: 15%;">Tanggal</th>
                <th style="width: 15%;">Absen Masuk</th>
                <th style="width: 15%;">Absen Pulang</th>
                <th style="width: 40%;">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${trHtml}
            </tbody>
          </table>

          <div class="clearfix">
            <div class="ttd-box">
              <p style="margin:0;">Banda Aceh, ${hariIni}</p>
              <p style="margin:0;">Kepala Sekolah ${schoolProfile.nama},</p>
              
              <p class="ttd-nama">${schoolProfile.kepsek}</p>
              <p style="margin:0;">NIP. ${schoolProfile.nipKepsek || '-'}</p>
            </div>
          </div>

          <script>
            window.onload = function() { 
              setTimeout(function(){
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  }

  function hideAdminMenus() {
    const sidebarNav = document.querySelector('.sidebar .nav');
    if (!sidebarNav) return;
    
    let shouldHide = false;
    const items = sidebarNav.querySelectorAll('.nav-item');
    
    items.forEach(item => {
      if (item.textContent.includes('MANAJEMEN') || item.textContent.includes('PENGATURAN')) {
        shouldHide = true;
        item.style.display = 'none';
        return;
      }
      if (item.textContent.includes('Logout')) {
        shouldHide = false; 
        return;
      }
      if (shouldHide) {
        item.style.display = 'none';
      }
    });
  }

  function formatTanggal(isoDate) {
    if(!isoDate) return '-';
    const parts = isoDate.split('-');
    if(parts.length !== 3) return isoDate;
    const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${parts[2]} ${namaBulan[parseInt(parts[1])-1]} ${parts[0]}`;
  }

  function getNamaHari(isoDate) {
    if(!isoDate) return '-';
    const d = new Date(isoDate);
    const nama = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    return nama[d.getDay()];
  }
});
