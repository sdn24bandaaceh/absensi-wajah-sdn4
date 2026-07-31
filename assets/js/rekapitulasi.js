$(document).ready(function() {
  let tableDetail = null;
  let tableSertifikasi = null;

  const filterBtn = document.getElementById('btnFilter');
  if (filterBtn) {
    filterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loadRekapitulasi();
    });
  }

  // Panggil pertama kali setelah semua deklarasi siap
  loadRekapitulasi();

  function getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  function loadRekapitulasi() {
    const month = document.getElementById('filterBulan') ? document.getElementById('filterBulan').value : '07';
    const year = document.getElementById('filterTahun') ? document.getElementById('filterTahun').value : '2026';
    const typeFilter = document.getElementById('filterJenisPegawai') ? document.getElementById('filterJenisPegawai').value : 'Semua';
    const jenisLaporan = document.getElementById('jenisLaporan') ? document.getElementById('jenisLaporan').value : 'detail';
    
    if (filterBtn) {
      filterBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
      filterBtn.disabled = true;
    }
    
    // Toggle UI containers
    const containerDetail = document.getElementById('containerRekapDetail');
    const containerSertifikasi = document.getElementById('containerRekapSertifikasi');
    
    if (jenisLaporan === 'detail') {
      containerDetail.classList.remove('d-none');
      containerSertifikasi.classList.add('d-none');
    } else {
      containerDetail.classList.add('d-none');
      containerSertifikasi.classList.remove('d-none');
    }

    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(filterBtn) {
        filterBtn.innerHTML = '<i class="bi bi-search me-2"></i>Filter';
        filterBtn.disabled = false;
      }
      
      if(res && res.success && res.data) {
        const data = res.data;
        
        let weeklySchedule = null;
        let holidays = [];
        if (data.settings) {
          try {
            if (data.settings.WEEKLY_SCHEDULE) weeklySchedule = JSON.parse(data.settings.WEEKLY_SCHEDULE);
            if (data.settings.HOLIDAYS) holidays = JSON.parse(data.settings.HOLIDAYS);
          } catch(e) { console.error("Error parsing settings", e); }
        }

        if (jenisLaporan === 'detail') {
          buildRekapDetail(data, month, year, typeFilter, weeklySchedule, holidays);
        } else {
          buildRekapSertifikasi(data, month, year, typeFilter, weeklySchedule, holidays);
        }
        
      } else {
        App.showToast('Gagal memuat rekapitulasi', 'error');
      }
    }).catch(err => {
      if(filterBtn) {
        filterBtn.innerHTML = '<i class="bi bi-search me-2"></i>Filter';
        filterBtn.disabled = false;
      }
      console.error(err);
      App.showToast('Koneksi bermasalah', 'error');
    });
  }

  function buildRekapDetail(data, month, year, typeFilter, weeklySchedule, holidays) {
    if ($.fn.DataTable.isDataTable('#tableRekap')) {
      $('#tableRekap').DataTable().destroy();
    }
    
    // Hitung total hari kerja dinamis
    const daysInMonth = getDaysInMonth(parseInt(year), parseInt(month));
    let totalKerja = 0;
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay(); 
      
      let isHoliday = false;
      
      if (holidays && holidays.length > 0) {
        for (const hol of holidays) {
          const hStart = hol.startDate || hol.date;
          const hEnd = hol.endDate || hStart;
          if (dateStr >= hStart && dateStr <= hEnd) {
            isHoliday = true;
            break;
          }
        }
      }
      
      if (!isHoliday && weeklySchedule && weeklySchedule[dayOfWeek]) {
        if (weeklySchedule[dayOfWeek].entryStart === "00:00" && weeklySchedule[dayOfWeek].entryEnd === "00:00") {
          isHoliday = true;
        }
      } else if (!weeklySchedule && dayOfWeek === 0) {
        isHoliday = true;
      }
      
      if (!isHoliday) {
        totalKerja++;
      }
    }
    
    let index = 1;
    let tbodyHtml = '';
    
    if (data.users && data.users.length > 0) {
      data.users.forEach(u => {
        try {
          if (u.role === 'Admin' || u.status === 'Admin' || u.role === 'superadmin') return;
          if (typeFilter !== 'Semua' && u.status !== typeFilter) return;
        
          let hadirLengkap = 0;
          let sakit = 0;
          let cutiTahunan = 0;
          
          if (data.attendance && data.attendance.length > 0) {
            data.attendance.forEach(a => {
              if (a.username === u.username || a.username === u.nip) {
                const dateStr = a.timestamp ? String(a.timestamp).split(',')[0].split('T')[0] : '';
                if (dateStr.startsWith(`${year}-${month}`)) {
                  hadirLengkap++;
                }
              }
            });
          }
          
          if (data.permits && data.permits.length > 0) {
            data.permits.forEach(p => {
               if ((p.username === u.username || p.username === u.nip) && p.status === 'Disetujui') {
                 const dateStr = p.tanggalMulai ? String(p.tanggalMulai).split('T')[0] : '';
                 if (dateStr.startsWith(`${year}-${month}`)) {
                   const tipe = p.tipe ? String(p.tipe).toLowerCase() : '';
                   if(tipe.includes('sakit')) sakit++;
                   else cutiTahunan++;
                 }
               }
            });
          }
          
          let tKet = Math.max(0, totalKerja - hadirLengkap - sakit - cutiTahunan);
          let percentage = totalKerja > 0 ? ((hadirLengkap / totalKerja) * 100).toFixed(1) : "0.0";
          let badgeColor = percentage >= 80 ? 'bg-success' : (percentage >= 50 ? 'bg-warning text-dark' : 'bg-danger');
          
          tbodyHtml += `
            <tr>
              <td class="text-center align-middle">${index++}</td>
              <td class="align-middle">
                <div class="text-start">
                  <div class="fw-bold text-primary-custom">${u.nama || '-'}</div>
                  <small class="text-muted">NIP. ${u.nip || '-'}</small>
                </div>
              </td>
              <td class="align-middle">${u.jabatan || '-'}</td>
              <td class="text-center align-middle"><span class="badge bg-primary rounded-pill px-3 py-1 shadow-sm">${u.status || '-'}</span></td>
              <td class="text-center align-middle fw-bold text-dark">${totalKerja}</td>
              <td class="text-center align-middle"><span class="badge bg-success rounded-pill px-3 py-2">${hadirLengkap} Hari</span></td>
              <td class="text-center align-middle"><span class="badge bg-secondary rounded-pill px-3 py-2">0 Hari</span></td>
              <td class="text-center align-middle"><span class="badge bg-danger rounded-pill px-3 py-2">${tKet} Hari</span></td>
              <td class="text-center align-middle"><span class="badge bg-info rounded-pill px-3 py-2 text-dark">${cutiTahunan + sakit} Hari</span></td>
              <td class="text-center align-middle"><span class="badge ${badgeColor} rounded-pill px-3 py-2 shadow-sm" style="font-size: 0.9rem;">${percentage}%</span></td>
            </tr>
          `;
        } catch (e) {
          console.error("Error processing user:", u, e);
        }
      });
    }
    
    $('#tableRekap tbody').html(tbodyHtml);
    
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const strBulan = monthNames[parseInt(month) - 1] || month;
    const docTitle = 'Rekapitulasi Absensi Wajah Bulan ' + strBulan + ' ' + year;
    
    tableDetail = $('#tableRekap').DataTable({
      language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json' },
      scrollX: true,
      ordering: false,
      lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Semua"]],
      pageLength: 10,
      dom: '<"d-flex flex-column flex-md-row justify-content-between align-items-center mb-3"<"d-flex align-items-center gap-3"lB>f>rt<"d-flex flex-column flex-md-row justify-content-between align-items-center mt-3"ip>',
      buttons: [
        {
          extend: 'excelHtml5',
          text: '<i class="bi bi-file-earmark-excel"></i> Export Excel',
          className: 'btn btn-success btn-sm mb-2 mb-md-0',
          title: docTitle
        },
        {
          extend: 'pdfHtml5',
          text: '<i class="bi bi-file-earmark-pdf"></i> Export PDF',
          className: 'btn btn-danger btn-sm mb-2 mb-md-0',
          orientation: 'landscape',
          title: docTitle,
          exportOptions: {
            format: {
              body: function (data, row, column, node) {
                // 1. Bersihkan seluruh tag HTML menjadi spasi
                let cleanText = data.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                // 2. Memaksa NIP turun ke bawah (baris baru)
                if (column === 1) {
                  return cleanText.replace(/ NIP\./g, '\nNIP.');
                }
                return cleanText;
              }
            }
          },
          customize: function(doc) {
             // 1. Dapatkan data profil sekolah
             let kepsek = "Nama Kepala Sekolah";
             let nipKepsek = "-";
             try {
                const profileStr = localStorage.getItem('schoolProfile');
                if(profileStr) {
                   const profile = JSON.parse(profileStr);
                   if(profile.kepsek) kepsek = profile.kepsek;
                   if(profile.nipKepsek) nipKepsek = profile.nipKepsek;
                }
             } catch(e){}

             // 2. Beri garis kotak pada tabel
             var objLayout = {};
             objLayout['hLineWidth'] = function(i) { return 0.5; };
             objLayout['vLineWidth'] = function(i) { return 0.5; };
             objLayout['hLineColor'] = function(i) { return '#000000'; };
             objLayout['vLineColor'] = function(i) { return '#000000'; };
             objLayout['paddingLeft'] = function(i) { return 4; };
             objLayout['paddingRight'] = function(i) { return 4; };
             doc.content[1].layout = objLayout;
             
             // Styling font dan warna tabel
             doc.defaultStyle.fontSize = 9;
             doc.styles.tableHeader.fontSize = 10;
             doc.styles.tableHeader.alignment = 'center';
             doc.styles.tableHeader.fillColor = '#343a40';
             doc.styles.tableHeader.color = '#ffffff';
             
             // 3. Tambahkan tanda tangan di bawah
             const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
             const strBulan = monthNames[parseInt(month) - 1] || month;
             const lastDate = new Date(year, parseInt(month), 0).getDate();
             const tglStr = lastDate + ' ' + strBulan + ' ' + year;
             
             doc.content.push({
               margin: [0, 40, 0, 0],
               columns: [
                 { width: '*', text: '' }, // pendorong dari kiri
                 {
                   width: 180, // lebar area tanda tangan
                   alignment: 'left', // teks di dalam area ini rata kiri
                   text: [
                     'Banda Aceh, ' + tglStr + '\n',
                     'Kepala Sekolah\n\n\n\n\n\n',
                     { text: kepsek, bold: true },
                     '\nNIP. ' + nipKepsek
                   ]
                 },
                 { width: 100, text: '' } // pendorong dari kanan (geser ke kiri)
               ]
             });
          }
        }
      ]
    });
  }

  function buildRekapSertifikasi(data, month, year, typeFilter, weeklySchedule, holidays) {
    if ($.fn.DataTable.isDataTable('#tableRekapSertifikasi')) {
      $('#tableRekapSertifikasi').DataTable().destroy();
    }
    
    const daysInMonth = getDaysInMonth(parseInt(year), parseInt(month));
    
    // Build Header
    let theadHtml = `
      <th class="text-center" width="50px">No</th>
      <th width="20%" style="min-width: 200px;">Nama Pegawai / NIP</th>
      <th width="15%" style="min-width: 150px;">Jabatan</th>
      <th class="text-center" width="10%">Status</th>
      <th class="text-center">H.Kerja</th>
    `;
    
    // Calculate calendar days
    let calendarDays = [];
    for (let d = 1; d <= daysInMonth; d++) {
      theadHtml += `<th class="text-center">${String(d).padStart(2, '0')}</th>`;
      const dateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
      const dateObj = new Date(dateStr);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday
      
      let isHoliday = false;
      
      // Check from HOLIDAYS array
      if (holidays && holidays.length > 0) {
        for (const hol of holidays) {
          const hStart = hol.startDate || hol.date;
          const hEnd = hol.endDate || hStart;
          if (dateStr >= hStart && dateStr <= hEnd) {
            isHoliday = true;
            break;
          }
        }
      }
      
      // Check from WEEKLY_SCHEDULE
      if (!isHoliday && weeklySchedule && weeklySchedule[dayOfWeek]) {
        if (weeklySchedule[dayOfWeek].entryStart === "00:00" && weeklySchedule[dayOfWeek].entryEnd === "00:00") {
          isHoliday = true;
        }
      } else if (!weeklySchedule && dayOfWeek === 0) { // Fallback if no settings: Sunday is holiday
        isHoliday = true;
      }
      
      calendarDays.push({
        date: dateStr,
        dayNum: d,
        isHoliday: isHoliday
      });
    }

    theadHtml += `
      <th class="text-center table-info border-start border-dark" title="Hadir">H</th>
      <th class="text-center table-warning border-start" title="Sakit">S</th>
      <th class="text-center table-primary border-start" title="Izin">I</th>
      <th class="text-center table-danger border-start" title="Alpa">A</th>
    `;
    
    $('#headerSertifikasi').html(theadHtml);
    
    let index = 1;
    let tbodyHtml = '';
    
    if (data.users && data.users.length > 0) {
      data.users.forEach(u => {
        try {
          if (u.role === 'superadmin' || u.role === 'Admin') return;
          if (typeFilter !== 'Semua' && u.status !== typeFilter) return;
        
          let totalHariKerja = 0;
          let rowHtml = `
            <tr>
              <td class="text-center align-middle">${index++}</td>
              <td class="align-middle" style="white-space: nowrap;">
                <div class="text-start">
                  <div class="fw-bold text-primary-custom">${u.nama || '-'}</div>
                  <small class="text-muted">NIP. ${u.nip || '-'}</small>
                </div>
              </td>
              <td class="align-middle" style="white-space: nowrap;">${u.jabatan || '-'}</td>
              <td class="text-center align-middle"><span class="badge bg-primary rounded-pill px-3 py-1 shadow-sm">${u.status || '-'}</span></td>
          `;
          
          let tdDays = '';
          
          let countH = 0;
          let countS = 0;
          let countI = 0;
          let countA = 0;

          calendarDays.forEach(day => {
            if (!day.isHoliday) totalHariKerja++; // Increment working days total
            
            let status = 'A'; // Default Alpa/Tanpa Keterangan
            
            if (day.isHoliday) {
              status = 'L';
            } else {
              // Check Permits/Cuti
              let isSakit = false;
              let isIzin = false;
              if (data.permits && data.permits.length > 0) {
                for (const p of data.permits) {
                  if ((p.username === u.username || p.username === u.nip) && p.status === 'Disetujui') {
                    const dStart = p.tanggalMulai ? String(p.tanggalMulai).split('T')[0] : '';
                    const dEnd = p.tanggalSelesai ? String(p.tanggalSelesai).split('T')[0] : dStart;
                    if (day.date >= dStart && day.date <= dEnd) {
                      const tipe = p.tipe ? String(p.tipe).toLowerCase() : '';
                      if (tipe.includes('sakit')) {
                         isSakit = true;
                      } else {
                         isIzin = true;
                      }
                      break;
                    }
                  }
                }
              }
              
              if (isSakit) {
                status = 'S';
              } else if (isIzin) {
                status = 'I';
              } else {
                // Check Attendance
                let hasAttended = false;
                if (data.attendance && data.attendance.length > 0) {
                  for (const a of data.attendance) {
                    if (a.username === u.username || a.username === u.nip) {
                      const aDate = a.timestamp ? String(a.timestamp).split(',')[0].split('T')[0] : '';
                      if (aDate === day.date) {
                        hasAttended = true;
                        break;
                      }
                    }
                  }
                }
                
                if (hasAttended) {
                  status = 'H';
                }
              }
            }

            if (status === 'H') countH++;
            else if (status === 'S') countS++;
            else if (status === 'I') countI++;
            else if (status === 'A') countA++;
            
            let textColor = status === 'L' ? 'text-danger fw-bold' : (status === 'S' || status === 'I' ? 'text-warning fw-bold' : (status === 'A' ? 'text-secondary' : 'text-success fw-bold'));
            tdDays += `<td class="text-center align-middle ${textColor}">${status}</td>`;
          });
          
          rowHtml += `<td class="text-center align-middle fw-bold text-dark">${totalHariKerja}</td>`;
          rowHtml += tdDays;
          rowHtml += `
            <td class="text-center align-middle border-start border-dark fw-bold text-success">${countH}</td>
            <td class="text-center align-middle border-start fw-bold text-warning">${countS}</td>
            <td class="text-center align-middle border-start fw-bold text-primary">${countI}</td>
            <td class="text-center align-middle border-start fw-bold text-danger">${countA}</td>
          </tr>`;
          
          tbodyHtml += rowHtml;
        } catch (e) {
          console.error("Error processing user:", u, e);
        }
      });
    }
    
    $('#tableRekapSertifikasi tbody').html(tbodyHtml);
    
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const strBulan = monthNames[parseInt(month) - 1] || month;
    const docTitle = 'Rekapitulasi Sertifikasi Bulan ' + strBulan + ' ' + year;
    
    tableSertifikasi = $('#tableRekapSertifikasi').DataTable({
      language: { url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json' },
      scrollX: true,
      ordering: false,
      lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Semua"]],
      pageLength: 10,
      dom: '<"d-flex flex-column flex-md-row justify-content-between align-items-center mb-3"<"d-flex align-items-center gap-3"lB>f>rt<"d-flex flex-column flex-md-row justify-content-between align-items-center mt-3"ip>',
      buttons: [
        {
          extend: 'excelHtml5',
          text: '<i class="bi bi-file-earmark-excel"></i> Export Excel',
          className: 'btn btn-success btn-sm mb-2 mb-md-0',
          title: docTitle
        },
        {
          extend: 'pdfHtml5',
          text: '<i class="bi bi-file-earmark-pdf"></i> Export PDF',
          className: 'btn btn-danger btn-sm mb-2 mb-md-0',
          orientation: 'landscape',
          pageSize: 'LEGAL',
          title: docTitle,
          exportOptions: {
            format: {
              body: function (data, row, column, node) {
                // 1. Bersihkan seluruh tag HTML menjadi spasi
                let cleanText = data.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                // 2. Memaksa NIP turun ke bawah (baris baru)
                if (column === 1) {
                  return cleanText.replace(/ NIP\./g, '\nNIP.');
                }
                return cleanText;
              }
            }
          },
          customize: function(doc) {
             let kepsek = "Nama Kepala Sekolah";
             let nipKepsek = "-";
             try {
                const profileStr = localStorage.getItem('schoolProfile');
                if(profileStr) {
                   const profile = JSON.parse(profileStr);
                   if(profile.kepsek) kepsek = profile.kepsek;
                   if(profile.nipKepsek) nipKepsek = profile.nipKepsek;
                }
             } catch(e){}

             var objLayout = {};
             objLayout['hLineWidth'] = function(i) { return 0.5; };
             objLayout['vLineWidth'] = function(i) { return 0.5; };
             objLayout['hLineColor'] = function(i) { return '#000000'; };
             objLayout['vLineColor'] = function(i) { return '#000000'; };
             objLayout['paddingLeft'] = function(i) { return 4; };
             objLayout['paddingRight'] = function(i) { return 4; };
             doc.content[1].layout = objLayout;
             
             doc.defaultStyle.fontSize = 7; 
             doc.styles.tableHeader.fontSize = 8;
             doc.styles.tableHeader.alignment = 'center';
             doc.styles.tableHeader.fillColor = '#343a40';
             doc.styles.tableHeader.color = '#ffffff';
             
             // Atur lebar kolom agar proporsional
             let colCount = doc.content[1].table.body[0].length;
             let customWidths = ['auto', 90, 50, 35, 'auto']; // No, Nama, Jabatan, Status, H.Kerja
             for(let i=5; i < colCount - 4; i++) {
               customWidths.push('auto'); // Kolom tanggal (lebar menyesuaikan isi 'L', 'H', dll agar sekecil mungkin)
             }
             customWidths.push('auto', 'auto', 'auto', 'auto'); // Hadir, Sakit, Izin, Alpa
             doc.content[1].table.widths = customWidths;

             const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
             const strBulan = monthNames[parseInt(month) - 1] || month;
             const lastDate = new Date(year, parseInt(month), 0).getDate();
             const tglStr = lastDate + ' ' + strBulan + ' ' + year;

             doc.content.push({
               margin: [0, 40, 0, 0],
               columns: [
                 { width: '*', text: '' }, // pendorong dari kiri
                 {
                   width: 180, // lebar area tanda tangan
                   alignment: 'left', // teks di dalam area ini rata kiri
                   text: [
                     'Banda Aceh, ' + tglStr + '\n',
                     'Kepala Sekolah\n\n\n\n\n\n',
                     { text: kepsek, bold: true },
                     '\nNIP. ' + nipKepsek
                   ]
                 },
                 { width: 140, text: '' } // pendorong dari kanan (geser ke kiri lebih jauh krn banyak kolom)
               ]
             });
          }
        }
      ]
    });
  }
});
