document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  const userRole = localStorage.getItem('userRole') || 'pegawai';

  // Apply role-based UI
  if (userRole === 'pegawai') {
    hideAdminMenus();
    restrictAdminPages();
  }

  // Update display name
  const userName = localStorage.getItem('userName') || 'Admin';
  const displayNameEl = document.getElementById('displayName');
  if (displayNameEl) {
    displayNameEl.textContent = userName.charAt(0).toUpperCase() + userName.slice(1);
  }
  
  // Update role badge
  const displayRoleEl = document.querySelector('.user-profile small.text-muted');
  if (displayRoleEl) {
    displayRoleEl.textContent = userRole === 'admin' ? 'Administrator' : 'Pegawai';
  }
  
  if (userRole === 'admin' || userRole === 'superadmin') {
    const btnEditPeng = document.getElementById('btnEditPengumuman');
    if (btnEditPeng) btnEditPeng.style.display = 'inline-block';
  }

  if (userRole === 'superadmin') {
    const menuProfil = document.getElementById('menuProfilSekolah');
    if (menuProfil) {
      menuProfil.classList.remove('d-none');
    }
  } else {
    // Hide Profil Sekolah panel from non-superadmin (in pengaturan.html)
    const panelProfil = document.getElementById('panelProfilSekolah');
    if (panelProfil) {
      panelProfil.style.display = 'none';
      // Make the app config panel take full width
      const appConfigPanel = document.getElementById('formAppConfig')?.closest('.col-lg-6');
      if (appConfigPanel) {
        appConfigPanel.classList.remove('col-lg-6');
        appConfigPanel.classList.add('col-lg-12');
      }
    }
  }

  initSidebar();
  initClock();
  
  // Load data for dashboard
  if (document.getElementById('statusChart')) {
    loadDashboardData();
  } else {
    animateCounters();
  }
});

function loadDashboardData() {
  App.fetchAPI('getDatabase', {}, 'GET').then(res => {
    if(res && res.success) {
      const data = res.data;
      
      const totalPegawai = data.users.length;
      let pns = 0, pppk = 0, honorer = 0;
      data.users.forEach(u => {
        if(u.status === 'PNS') pns++;
        else if(u.status === 'PPPK') pppk++;
        else honorer++;
      });
      
      const today = new Date().toISOString().slice(0, 10);
      let hadir = 0;
      let terlambat = 0;
      
      data.attendance.forEach(a => {
        if (a.timestamp && a.timestamp.includes(today)) {
          hadir++;
          if(a.keterangan && a.keterangan.toLowerCase().includes('terlambat')) terlambat++;
        }
      });
      
      const belumHadir = Math.max(0, totalPegawai - hadir);
      
      // Update Counters
      const counters = document.querySelectorAll('.counter');
      if (counters.length >= 4) {
        counters[0].setAttribute('data-target', totalPegawai);
        counters[1].setAttribute('data-target', hadir);
        counters[2].setAttribute('data-target', terlambat);
        counters[3].setAttribute('data-target', belumHadir);
      }
      
      renderPengumuman(data.settings);
      renderIzin(data.permits);
      
      if (typeof renderRingkasanHarian === 'function') {
        renderRingkasanHarian(data.users, data.attendance, data.permits);
      }
      
      // Update School Profile dynamically
      if (data.settings && data.settings.SCHOOL_PROFILE) {
        localStorage.setItem('schoolProfile', data.settings.SCHOOL_PROFILE);
        if (App.applySchoolProfile) App.applySchoolProfile();
      }
      
      initCharts(pns, pppk, honorer);
      animateCounters();
    } else {
      initCharts(60, 40, 50); // fallback
      animateCounters();
    }
  }).catch(err => {
    initCharts(60, 40, 50); // fallback
    animateCounters();
  });
}

function renderPengumuman(settings) {
  const container = document.getElementById('pengumumanList');
  if (!container) return;
  
  try {
    const announcements = settings.ANNOUNCEMENTS ? JSON.parse(settings.ANNOUNCEMENTS) : [];
    currentAnnouncements = announcements;
    
    if (announcements.length === 0) {
      container.innerHTML = '<div class="alert alert-secondary small border-0">Belum ada pengumuman saat ini.</div>';
      return;
    }
    
    let html = '';
    announcements.forEach((a, index) => {
      const type = a.type || 'info';
      const mt = index > 0 ? 'mt-3' : '';
      html += `
        <div class="alert alert-${type} border-0 bg-${type} bg-opacity-10 ${mt}">
          <h6 class="alert-heading fw-bold">${a.title}</h6>
          <p class="mb-0 small">${a.content}</p>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '<div class="alert alert-secondary small border-0">Belum ada pengumuman saat ini.</div>';
  }
}

function renderIzin(permits) {
  const container = document.getElementById('izinList');
  if (!container) return;
  
  const pendingPermits = (permits || []).filter(p => p.status === 'Menunggu Persetujuan');
  
  if (pendingPermits.length === 0) {
    container.innerHTML = '<div class="p-3 text-center text-muted small">Tidak ada izin menunggu persetujuan.</div>';
    return;
  }
  
  let html = '';
  pendingPermits.slice(0, 4).forEach(p => {
    html += `
      <div class="list-group-item bg-transparent d-flex justify-content-between align-items-center border-bottom border-light px-0 py-2">
        <div class="d-flex align-items-center gap-3">
          <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.nama)}&background=random" class="rounded-circle" width="40">
          <div>
            <h6 class="mb-0 fw-bold text-truncate" style="max-width: 150px;">${p.nama}</h6>
            <small class="text-muted d-block text-truncate" style="max-width: 150px;">${p.tipe}</small>
          </div>
        </div>
        <button class="btn btn-sm btn-primary-custom hover-scale" onclick="window.location.href='izin.html'">Review</button>
      </div>
    `;
  });
  
  if(pendingPermits.length > 4) {
      html += `<div class="text-center mt-3"><a href="izin.html" class="small text-decoration-none">Lihat Semua (${pendingPermits.length})</a></div>`;
  }
  container.innerHTML = html;
}

function hideAdminMenus() {
  const sidebarNav = document.querySelector('.sidebar .nav');
  if (!sidebarNav) return;
  
  let shouldHide = false;
  const items = sidebarNav.querySelectorAll('.nav-item');
  
  items.forEach(item => {
    // If we hit MANAJEMEN or PENGATURAN headers, start hiding
    if (item.textContent.includes('MANAJEMEN') || item.textContent.includes('PENGATURAN')) {
      shouldHide = true;
      item.style.display = 'none';
      return;
    }
    
    // Always show logout
    if (item.textContent.includes('Logout')) {
      shouldHide = false; 
      return;
    }
    
    if (shouldHide) {
      item.style.display = 'none';
    }
  });
}

function restrictAdminPages() {
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop();
  const adminPages = [
    'pegawai.html', 'rekapitulasi.html', 'laporan.html', 
    'geofencing.html', 'jam-kerja.html', 'hari-libur.html', 
    'pengguna.html', 'pengaturan.html'
  ];
  
  if (adminPages.includes(currentPage)) {
    App.showToast('Anda tidak memiliki akses ke halaman ini', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1000);
  }
}

function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('mainContent');
  const toggleBtn = document.getElementById('sidebarToggle');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      mainContent.classList.toggle('sidebar-open');
    });
  }

  // Close sidebar on mobile when clicking outside
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 992) {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target) && sidebar.classList.contains('show')) {
        sidebar.classList.remove('show');
        mainContent.classList.remove('sidebar-open');
      }
    }
  });
}

function initClock() {
  const clockEl = document.getElementById('digitalClock');
  if (!clockEl) return;

  const updateClock = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    clockEl.innerHTML = `${dateString} <span class="ms-2 badge bg-primary">${timeString}</span>`;
  };

  updateClock();
  setInterval(updateClock, 1000);
}

function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  const speed = 200;

  counters.forEach(counter => {
    const updateCount = () => {
      const target = +counter.getAttribute('data-target');
      const count = +counter.innerText;
      const inc = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + inc);
        setTimeout(updateCount, 1);
      } else {
        counter.innerText = target;
      }
    };
    updateCount();
  });
}

function initCharts(pns = 60, pppk = 40, honorer = 50) {
  // Chart.js global config for dark mode support
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#F8FAFC' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  
  Chart.defaults.color = textColor;
  
  // Weekly Chart dihapus dan diganti dengan list Ringkasan Kehadiran Hari Ini

  // Status Chart
  const statusCtx = document.getElementById('statusChart');
  if (statusCtx) {
    new Chart(statusCtx, {
      type: 'doughnut',
      data: {
        labels: ['PNS', 'PPPK', 'Kontrak/Honor'],
        datasets: [{
          data: [pns, pppk, honorer],
          backgroundColor: ['#0EA5E9', '#F59E0B', '#EF4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }
}

function renderRingkasanHarian(users, attendance, permits) {
  const today = new Date().toISOString().slice(0, 10);
  
  let hadirData = [];
  let terlambatData = [];
  
  attendance.forEach(a => {
    if (a.timestamp && a.timestamp.includes(today)) {
      const timeOnly = a.timestamp.split('T')[1]?.slice(0,8) || a.timestamp.split(' ')[1] || a.timestamp;
      const isTerlambat = a.keterangan && a.keterangan.toLowerCase().includes('terlambat');
      
      const item = { nama: a.nama, username: a.username, waktu: timeOnly, status: a.status };
      
      hadirData.push(item);
      if (isTerlambat) terlambatData.push(item);
    }
  });
  
  // Sort hadirData by time (earliest first)
  hadirData.sort((a, b) => a.waktu.localeCompare(b.waktu));
  
  // Pegawai Izin hari ini
  let izinData = [];
  permits.forEach(p => {
    if (p.status.includes('Disetujui')) {
      // Periksa apakah today berada di antara tanggalMulai dan tanggalSelesai
      const start = new Date(p.tanggalMulai).toISOString().slice(0, 10);
      const end = new Date(p.tanggalSelesai).toISOString().slice(0, 10);
      if (today >= start && today <= end) {
        izinData.push({ nama: p.nama, username: p.username, tipe: p.tipe });
      }
    }
  });
  
  // Belum absen
  let belumAbsenData = [];
  const hadirUsernames = hadirData.map(h => h.username);
  const izinUsernames = izinData.map(i => i.username);
  
  users.forEach(u => {
    // Abaikan admin, hanya hitung pegawai
    if (u.role === 'admin') return;
    
    if (!hadirUsernames.includes(u.username) && !izinUsernames.includes(u.username)) {
      belumAbsenData.push({ nama: u.nama, username: u.username, jabatan: u.jabatan });
    }
  });
  
  // -- Render ke HTML --
  
  // 1. Hadir
  const listHadir = document.getElementById('listHadir');
  if (listHadir) {
    if (hadirData.length === 0) {
      listHadir.innerHTML = '<div class="text-muted text-center my-3">Belum ada yang hadir.</div>';
    } else {
      let html = '';
      hadirData.forEach((item, index) => {
        let badge = '';
        if (index < 5) {
          badge = '<span class="badge bg-success rounded-pill" title="5 Tercepat"><i class="bi bi-award-fill"></i> Top</span>';
        }
        html += `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <div class="fw-bold text-truncate" style="max-width: 150px;">${item.nama}</div>
              <small class="text-muted"><i class="bi bi-clock"></i> ${item.waktu}</small>
            </div>
            ${badge}
          </div>
        `;
      });
      listHadir.innerHTML = html;
    }
  }
  
  // 2. Terlambat
  const listTerlambat = document.getElementById('listTerlambat');
  if (listTerlambat) {
    if (terlambatData.length === 0) {
      listTerlambat.innerHTML = '<div class="text-muted text-center my-3">Tidak ada yang terlambat.</div>';
    } else {
      let html = '';
      terlambatData.forEach(item => {
        html += `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div class="fw-bold text-truncate" style="max-width: 150px;">${item.nama}</div>
            <span class="badge bg-warning text-dark"><i class="bi bi-clock-history"></i> ${item.waktu}</span>
          </div>
        `;
      });
      listTerlambat.innerHTML = html;
    }
  }
  
  // 3. Izin
  const listIzin = document.getElementById('listIzinHariIni');
  if (listIzin) {
    if (izinData.length === 0) {
      listIzin.innerHTML = '<div class="text-muted text-center my-3">Tidak ada pegawai izin hari ini.</div>';
    } else {
      let html = '';
      izinData.forEach(item => {
        html += `
          <div class="list-group-item d-flex justify-content-between align-items-center">
            <div class="fw-bold text-truncate" style="max-width: 150px;">${item.nama}</div>
            <span class="badge bg-info">${item.tipe}</span>
          </div>
        `;
      });
      listIzin.innerHTML = html;
    }
  }
  
  // 4. Belum Absen
  const listBelumAbsen = document.getElementById('listBelumAbsen');
  if (listBelumAbsen) {
    if (belumAbsenData.length === 0) {
      listBelumAbsen.innerHTML = '<div class="text-muted text-center my-3">Semua pegawai sudah absen/izin.</div>';
    } else {
      let html = '';
      belumAbsenData.forEach(item => {
        html += `
          <div class="list-group-item d-flex flex-column">
            <div class="fw-bold">${item.nama}</div>
            <small class="text-muted">${item.jabatan}</small>
          </div>
        `;
      });
      listBelumAbsen.innerHTML = html;
    }
  }
}

// --- FUNGSI KELOLA PENGUMUMAN ---
let currentAnnouncements = [];

window.openPengumumanModal = function() {
  const modal = new bootstrap.Modal(document.getElementById('modalPengumuman'));
  modal.show();
};

document.getElementById('formPengumuman')?.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const btn = e.target.querySelector('button[type="submit"]');
  const originalTxt = btn.innerHTML;
  btn.innerHTML = 'Menyimpan...';
  btn.disabled = true;
  
  const payload = {
    title: document.getElementById('pengumumanTitle').value,
    content: document.getElementById('pengumumanContent').value,
    type: document.getElementById('pengumumanType').value
  };
  
  App.fetchAPI('addAnnouncement', payload, 'POST')
    .then(res => {
      btn.innerHTML = originalTxt;
      btn.disabled = false;
      if (res && res.success) {
        App.showToast('Pengumuman berhasil ditambahkan', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalPengumuman'));
        modal.hide();
        e.target.reset();
        setTimeout(() => location.reload(), 1000);
      }
    })
    .catch(() => {
      btn.innerHTML = originalTxt;
      btn.disabled = false;
      App.showToast('Gagal menyimpan pengumuman', 'error');
    });
});

window.clearPengumuman = function() {
  Swal.fire({
    title: 'Hapus Semua Pengumuman?',
    text: "Tindakan ini tidak bisa dibatalkan",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: 'Menghapus...', didOpen: () => Swal.showLoading() });
      App.fetchAPI('updateSettings', { settings: { ANNOUNCEMENTS: JSON.stringify([]) } }, 'POST')
        .then(res => {
           if(res.success) {
             Swal.fire('Berhasil', 'Pengumuman telah dibersihkan', 'success').then(() => location.reload());
           }
        });
    }
  });
};
