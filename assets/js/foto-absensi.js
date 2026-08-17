document.addEventListener('DOMContentLoaded', () => {
  App.init();

  const dailyDateInput = document.getElementById('dailyDate');
  const monthlyDateInput = document.getElementById('monthlyDate');
  const currentDateDisplay = document.getElementById('currentDateDisplay');
  const searchDailyInput = document.getElementById('searchDaily');

  let fullDatabase = { users: [], attendance: [], settings: {} };

  // Set default dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const monthStr = today.toISOString().slice(0, 7);

  if (dailyDateInput) dailyDateInput.value = todayStr;
  if (monthlyDateInput) monthlyDateInput.value = monthStr;
  
  updateDateDisplay();

  // Load Data
  loadData();

  // Listeners
  if (dailyDateInput) {
    dailyDateInput.addEventListener('change', () => {
      updateDateDisplay();
      renderDailyView();
    });
  }
  
  if (monthlyDateInput) {
    monthlyDateInput.addEventListener('change', () => {
      updateDateDisplay();
      renderMonthlyView();
    });
  }

  if (searchDailyInput) {
    searchDailyInput.addEventListener('input', () => {
      renderDailyView();
    });
  }

  document.getElementById('btnPrevDay')?.addEventListener('click', () => changeDay(-1));
  document.getElementById('btnNextDay')?.addEventListener('click', () => changeDay(1));

  async function loadData() {
    try {
      const res = await App.getDatabase();
      if (res && res.success) {
        fullDatabase = res.data;
        renderDailyView();
        renderMonthlyView();
      } else {
        App.showToast('Gagal memuat data dari server', 'error');
      }
    } catch (e) {
      console.error(e);
      App.showToast('Terjadi kesalahan jaringan', 'error');
    }
  }

  function changeDay(delta) {
    if (!dailyDateInput) return;
    const current = new Date(dailyDateInput.value);
    current.setDate(current.getDate() + delta);
    dailyDateInput.value = current.toISOString().split('T')[0];
    updateDateDisplay();
    renderDailyView();
  }

  function updateDateDisplay() {
    const activeTab = document.querySelector('.nav-tabs-custom .nav-link.active');
    if (!activeTab || !currentDateDisplay) return;
    
    if (activeTab.id === 'harian-tab') {
      const d = new Date(dailyDateInput.value);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      currentDateDisplay.textContent = d.toLocaleDateString('id-ID', options);
    } else {
      const parts = monthlyDateInput.value.split('-');
      const d = new Date(parts[0], parts[1] - 1, 1);
      const options = { month: 'long', year: 'numeric' };
      currentDateDisplay.textContent = d.toLocaleDateString('id-ID', options);
    }
  }

  // Update Display when tab changes
  document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener('shown.bs.tab', updateDateDisplay);
  });

  function getJamKerja(settings) {
    let checkInStart = '06:00', checkInEnd = '07:30', checkOutStart = '14:00';
    try {
      if (settings && settings.JAM_KERJA) {
        const jamKerjaList = JSON.parse(settings.JAM_KERJA);
        if (jamKerjaList && jamKerjaList.length > 0) {
          checkInStart = jamKerjaList[0].jamMasukMulai || '06:00';
          checkInEnd = jamKerjaList[0].jamMasukSelesai || '07:30';
          checkOutStart = jamKerjaList[0].jamPulangMulai || '14:00';
        }
      }
    } catch (e) {}
    return { checkInStart, checkInEnd, checkOutStart };
  }

  function renderDailyView() {
    const grid = document.getElementById('dailyGrid');
    if (!grid) return;
    
    const selectedDate = dailyDateInput.value; // YYYY-MM-DD
    const searchQuery = searchDailyInput ? searchDailyInput.value.toLowerCase() : '';
    
    const users = fullDatabase.users || [];
    const attendance = fullDatabase.attendance || [];
    const settings = fullDatabase.settings || {};
    
    const jamKerja = getJamKerja(settings);

    // Group attendance by user for selected date
    const dailyMap = {};
    
    attendance.forEach(a => {
      if (!a.timestamp) return;
      const tsStr = String(a.timestamp);
      // Format timestamp bisa ISO (YYYY-MM-DD) atau format lokal
      const aDateObj = new Date(tsStr);
      if (isNaN(aDateObj.getTime())) return;
      
      const aDateIso = aDateObj.toISOString().split('T')[0];
      if (aDateIso === selectedDate) {
        const username = a.username;
        if (!dailyMap[username]) dailyMap[username] = { masuk: null, pulang: null };
        
        // Pilih foto yang masuk
        if (a.status === 'Masuk') {
            dailyMap[username].masuk = a;
        } else if (a.status === 'Pulang') {
            dailyMap[username].pulang = a;
        } else {
            // Fallback (jika status tidak terdeteksi, asumsi masuk jika belum ada)
            if (!dailyMap[username].masuk) dailyMap[username].masuk = a;
            else dailyMap[username].pulang = a;
        }
      }
    });

    let html = '';
    let hadirCount = 0;
    let telatCount = 0;
    let renderedCount = 0;

    users.forEach(u => {
      // Hanya tampilkan jika user bukan superadmin
      if (u.role === 'superadmin' || u.role === 'admin') return;

      const record = dailyMap[u.username];
      
      if (record && (record.masuk || record.pulang)) {
        hadirCount++;
        
        let photoItem = null;
        if (record.masuk && record.masuk.photo) photoItem = record.masuk;
        else if (record.pulang && record.pulang.photo) photoItem = record.pulang;
        else photoItem = record.masuk || record.pulang;
        
        let timeStr = '-';
        let isLate = false;
        
        if (photoItem && photoItem.timestamp) {
            const dateObj = new Date(photoItem.timestamp);
            timeStr = dateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
            
            if (photoItem.status === 'Masuk' || !photoItem.status) {
                if (timeStr > jamKerja.checkInEnd) isLate = true;
            }
        }
        if (isLate) telatCount++;

        // Filter search
        if (searchQuery && !u.nama.toLowerCase().includes(searchQuery) && !(u.nip || '').toLowerCase().includes(searchQuery)) {
            return;
        }

        renderedCount++;
        
        let displayPhoto = photoItem.photo;
        let photoHtml = '';
        if (displayPhoto && displayPhoto !== 'null' && displayPhoto !== 'undefined' && displayPhoto.trim() !== '') {
            if (displayPhoto.includes('/d/')) displayPhoto = App.getDirectImageUrl(displayPhoto);
            photoHtml = `<img src="${displayPhoto}" alt="Foto ${u.nama}" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(u.nama)}&background=f1f5f9'">`;
        } else {
            photoHtml = `<div class="w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-light text-primary" style="font-size: 1.2rem; font-weight: bold;"><div>Absen</div><div>Manual</div></div>`;
        }

        const statusClass = isLate ? 'late' : 'ontime';
        const iconClass = isLate ? 'bi-clock-history' : 'bi-check-lg';
        
        const masukData = record.masuk ? encodeURIComponent(JSON.stringify(record.masuk)) : '';
        const pulangData = record.pulang ? encodeURIComponent(JSON.stringify(record.pulang)) : '';
        const userData = encodeURIComponent(JSON.stringify(u));
        const dateData = selectedDate;

        html += `
          <div class="col-12 col-sm-6 col-md-4 col-xl-3" data-aos="zoom-in" data-aos-duration="400">
            <div class="photo-card" onclick="window.showPhotoDetail('${userData}', '${dateData}', '${masukData}', '${pulangData}')" style="cursor:pointer;">
              <div class="photo-container">
                <span class="time-badge ${statusClass}">${timeStr} ${photoItem.status === 'Pulang' ? '(Plg)' : ''}</span>
                <div class="status-icon ${statusClass}"><i class="bi ${iconClass}"></i></div>
                ${photoHtml}
              </div>
              <div class="p-3">
                <h6 class="mb-1 fw-bold text-truncate" title="${u.nama}">${u.nama}</h6>
                <p class="mb-0 small text-muted text-truncate">${u.pangkat || 'Pegawai'}</p>
              </div>
            </div>
          </div>
        `;
      }
    });

    const activeUsers = users.filter(u => u.role !== 'superadmin' && u.role !== 'admin').length;
    const absenCount = activeUsers - hadirCount;

    document.getElementById('dailyTotal').textContent = activeUsers;
    document.getElementById('dailyHadir').textContent = hadirCount;
    document.getElementById('dailyTelat').textContent = telatCount;
    document.getElementById('dailyAbsen').textContent = absenCount < 0 ? 0 : absenCount;
    
    document.getElementById('dailyHadirPct').textContent = activeUsers ? Math.round((hadirCount/activeUsers)*100) + '%' : '0%';
    document.getElementById('dailyTelatPct').textContent = activeUsers ? Math.round((telatCount/activeUsers)*100) + '%' : '0%';
    document.getElementById('dailyAbsenPct').textContent = activeUsers ? Math.round((absenCount/activeUsers)*100) + '%' : '0%';

    document.getElementById('dailyShowingText').textContent = `Menampilkan ${renderedCount} dari ${hadirCount} pegawai yang hadir`;

    if (renderedCount === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-images text-muted" style="font-size: 3rem;"></i>
          <h6 class="mt-3 text-muted">Tidak ada data foto untuk hari ini</h6>
        </div>
      `;
    } else {
      grid.innerHTML = html;
    }
  }

  function renderMonthlyView() {
    const tbody = document.getElementById('monthlyTbody');
    const headerRow1 = document.getElementById('monthlyHeaderRow1');
    const headerRow2 = document.getElementById('monthlyHeaderRow2');
    
    if (!tbody || !monthlyDateInput) return;

    const parts = monthlyDateInput.value.split('-');
    if (parts.length !== 2) return;
    
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // 0-based
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const users = fullDatabase.users || [];
    const attendance = fullDatabase.attendance || [];
    const settings = fullDatabase.settings || {};
    const jamKerja = getJamKerja(settings);

    // Build Headers
    let hr1 = '<th rowspan="2" class="name-col bg-white">NAMA PEGAWAI</th>';
    let hr2 = '';
    
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const isWeekend = (d.getDay() === 0);
      const colorClass = isWeekend ? 'text-danger' : '';
      
      hr1 += `<th class="day-col ${colorClass}">${i}</th>`;
      hr2 += `<th class="day-col small fw-normal ${colorClass}">${dayNames[d.getDay()]}</th>`;
    }
    
    headerRow1.innerHTML = hr1;
    headerRow2.innerHTML = hr2;

    // Filter Active users
    const targetUsers = users.filter(u => u.role !== 'superadmin' && u.role !== 'admin');
    
    if (targetUsers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${daysInMonth + 1}" class="text-center py-4">Tidak ada data pegawai</td></tr>`;
      return;
    }

    // Map Attendance
    const monthPrefix = `${year}-${String(month+1).padStart(2,'0')}`;
    const attMap = {}; // { username: { 'YYYY-MM-DD': { masuk: obj, pulang: obj } } }
    
    attendance.forEach(a => {
      if (!a.timestamp) return;
      const tsStr = String(a.timestamp);
      const aDateObj = new Date(tsStr);
      if (isNaN(aDateObj.getTime())) return;
      
      const aDateIso = aDateObj.toISOString().split('T')[0];
      if (aDateIso.startsWith(monthPrefix)) {
        if (!attMap[a.username]) attMap[a.username] = {};
        if (!attMap[a.username][aDateIso]) attMap[a.username][aDateIso] = { masuk: null, pulang: null };
        
        if (a.status === 'Masuk' || !a.status) attMap[a.username][aDateIso].masuk = a;
        if (a.status === 'Pulang') attMap[a.username][aDateIso].pulang = a;
      }
    });

    let html = '';

    targetUsers.forEach(u => {
      let avatar = u.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nama)}&background=f1f5f9`;
      if (avatar.includes('/d/')) avatar = App.getDirectImageUrl(avatar);
      
      let rowHtml = `
        <tr>
          <td class="name-col bg-white align-top">
            <div class="d-flex flex-column gap-1 py-1">
              <img src="${avatar}" class="rounded" width="60" height="60" style="object-fit:cover; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <div class="fw-bold text-wrap mt-1" style="font-size: 0.8rem; line-height: 1.2;">${u.nama}</div>
              <div class="text-muted" style="font-size: 0.7rem;">${u.jabatan || 'Pegawai'}</div>
              <div class="text-muted" style="font-size: 0.65rem;">NIP. ${u.nip || '-'}</div>
            </div>
          </td>
      `;
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${monthPrefix}-${String(i).padStart(2, '0')}`;
        const record = (attMap[u.username] && attMap[u.username][dateStr]) ? attMap[u.username][dateStr] : null;
        
        if (record && (record.masuk || record.pulang)) {
          let photoItem = null;
          if (record.masuk && record.masuk.photo) photoItem = record.masuk;
          else if (record.pulang && record.pulang.photo) photoItem = record.pulang;
          else photoItem = record.masuk || record.pulang;
          
          let thumbSrc = photoItem.photo;
          let thumbHtml = '';
          
          if (thumbSrc && thumbSrc !== 'null' && thumbSrc !== 'undefined' && thumbSrc.trim() !== '') {
            if (thumbSrc.includes('/d/')) thumbSrc = App.getDirectImageUrl(thumbSrc);
            thumbHtml = `<img src="${thumbSrc}" class="tiny-thumb" alt="Foto" loading="lazy" onerror="this.outerHTML='<div class=\\'tiny-thumb d-flex flex-column align-items-center justify-content-center bg-light text-primary border\\' style=\\'font-size: 0.6rem; font-weight: bold; line-height: 1;\\'><span>Manual</span></div>'">`;
          } else {
            thumbHtml = `<div class="tiny-thumb d-flex flex-column align-items-center justify-content-center bg-light text-primary border" style="font-size: 0.6rem; font-weight: bold; line-height: 1;"><span>Manual</span></div>`;
          }
          
          let mTime = '-';
          let pTime = '-';
          let isLate = false;
          
          if (record.masuk && record.masuk.timestamp) {
            const d = new Date(record.masuk.timestamp);
            mTime = d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
            if (mTime > jamKerja.checkInEnd) isLate = true;
          }
          if (record.pulang && record.pulang.timestamp) {
            const d = new Date(record.pulang.timestamp);
            pTime = d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
          }
          
          const statusClass = isLate ? 'late' : 'ontime';
          
          const masukData = record.masuk ? encodeURIComponent(JSON.stringify(record.masuk)) : '';
          const pulangData = record.pulang ? encodeURIComponent(JSON.stringify(record.pulang)) : '';
          const userData = encodeURIComponent(JSON.stringify(u));
          
          rowHtml += `
            <td>
              <div class="thumb-cell" onclick="window.showPhotoDetail('${userData}', '${dateStr}', '${masukData}', '${pulangData}')">
                <div class="thumb-wrapper">
                  ${thumbHtml}
                  <div class="tiny-status-dot ${statusClass}"></div>
                </div>
                <div class="tiny-time">${mTime}</div>
                <div class="tiny-time">${pTime !== '-' ? pTime : ''}</div>
              </div>
            </td>
          `;
        } else {
          rowHtml += `<td><span class="text-muted">-</span></td>`;
        }
      }
      
      rowHtml += `</tr>`;
      html += rowHtml;
    });

    tbody.innerHTML = html;
  }
  
  // Global Function for Modal
  window.showPhotoDetail = function(userDataStr, dateStr, masukDataStr, pulangDataStr) {
    try {
      const u = JSON.parse(decodeURIComponent(userDataStr));
      const masuk = masukDataStr ? JSON.parse(decodeURIComponent(masukDataStr)) : null;
      const pulang = pulangDataStr ? JSON.parse(decodeURIComponent(pulangDataStr)) : null;
      
      // Update User Info
      document.getElementById('previewNama').textContent = u.nama;
      document.getElementById('previewRole').textContent = (u.pangkat || 'Pegawai') + (u.nip ? ' / ' + u.nip : '');
      
      let avatar = u.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nama)}&background=f1f5f9`;
      if (avatar.includes('/d/')) avatar = App.getDirectImageUrl(avatar);
      document.getElementById('previewAvatar').src = avatar;
      
      // Date Display
      const dOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      document.getElementById('previewTanggal').textContent = new Date(dateStr).toLocaleDateString('id-ID', dOptions);
      
      // Masuk Reset
      const imgMasuk = document.getElementById('previewFotoMasuk');
      const noMasuk = document.getElementById('noFotoMasuk');
      if (masuk && masuk.photo) {
        imgMasuk.style.display = 'block';
        noMasuk.style.display = 'none';
        let src = masuk.photo;
        if (src.includes('/d/')) src = App.getDirectImageUrl(src);
        imgMasuk.src = src;
        
        document.getElementById('previewWaktuMasuk').textContent = new Date(masuk.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
        document.getElementById('previewStatusMasuk').textContent = (masuk.status === 'Telat' || masuk.keterangan === 'Telat') ? 'Terlambat' : 'Tepat Waktu';
      } else {
        imgMasuk.style.display = 'none';
        noMasuk.style.display = 'flex';
        document.getElementById('previewWaktuMasuk').textContent = '-';
        document.getElementById('previewStatusMasuk').textContent = '-';
      }
      
      // Pulang Reset
      const imgPulang = document.getElementById('previewFotoPulang');
      const noPulang = document.getElementById('noFotoPulang');
      if (pulang && pulang.photo) {
        imgPulang.style.display = 'block';
        noPulang.style.display = 'none';
        let src = pulang.photo;
        if (src.includes('/d/')) src = App.getDirectImageUrl(src);
        imgPulang.src = src;
        
        document.getElementById('previewWaktuPulang').textContent = new Date(pulang.timestamp).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
      } else {
        imgPulang.style.display = 'none';
        noPulang.style.display = 'flex';
        document.getElementById('previewWaktuPulang').textContent = '-';
      }
      
      const modal = new bootstrap.Modal(document.getElementById('modalPreviewFoto'));
      modal.show();
    } catch(e) {
      console.error(e);
    }
  };
});
