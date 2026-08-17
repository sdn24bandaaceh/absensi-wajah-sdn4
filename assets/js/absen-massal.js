document.addEventListener('DOMContentLoaded', () => {
  // Hanya admin atau superadmin yang boleh mengakses
  const userRole = localStorage.getItem('userRole');
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    Swal.fire({
      icon: 'error',
      title: 'Akses Ditolak',
      text: 'Halaman ini hanya untuk Administrator.'
    }).then(() => {
      window.location.href = 'dashboard.html';
    });
    return;
  }

  // Set default date and time
  const now = new Date();
  const dateInput = document.getElementById('am_tanggal');
  const timeInput = document.getElementById('am_jam');
  const statusSelect = document.getElementById('am_status');
  
  dateInput.value = now.toISOString().split('T')[0];
  timeInput.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  // Event listener untuk Auto-fill jam
  dateInput.addEventListener('change', autoFillTime);
  statusSelect.addEventListener('change', autoFillTime);

  // Load Work Hours (Jam Kerja) config
  loadConfig();

  // Handle form submit
  document.getElementById('formAbsenMassal').addEventListener('submit', function(e) {
    e.preventDefault();
    submitManualAbsenMassal();
  });
});

let workHours = [];

function autoFillTime() {
  if (workHours.length === 0) return;

  const dateVal = document.getElementById('am_tanggal').value;
  if (!dateVal) return;

  const dateObj = new Date(dateVal);
  const dayId = dateObj.getDay(); // 0 = Sunday, 1 = Monday
  const dayConfig = workHours[dayId];
  
  if (dayConfig && !dayConfig.libur) {
    const status = document.getElementById('am_status').value;
    const timeInput = document.getElementById('am_jam');
    if (status === 'Masuk' && dayConfig.entryStart) {
      timeInput.value = dayConfig.entryStart;
    } else if (status === 'Pulang' && dayConfig.exitStart) {
      timeInput.value = dayConfig.exitStart;
    }
  }
}

function loadConfig() {
  App.getDatabase().then(res => {
    if (res && res.success && res.data && res.data.settings) {
      if (res.data.settings.WORK_HOURS) {
        try { 
          workHours = JSON.parse(res.data.settings.WORK_HOURS); 
          autoFillTime(); // Langsung coba auto-fill pertama kali
        } catch(e) {}
      }
    } else {
      App.showToast('Gagal memuat konfigurasi', 'error');
    }
  }).catch(() => {
    App.showToast('Koneksi bermasalah', 'error');
  });
}

function submitManualAbsenMassal(forceEdit = false) {
  const date = document.getElementById('am_tanggal').value;
  const time = document.getElementById('am_jam').value;
  const status = document.getElementById('am_status').value;
  const keterangan = document.getElementById('am_keterangan').value;

  if (!date || !time || !status) {
    App.showToast('Mohon lengkapi semua field bertanda bintang (*)', 'warning');
    return;
  }

  const payload = {
    date: date,
    time: time,
    status: status,
    keterangan: keterangan,
    forceEdit: forceEdit
  };

  const btn = document.getElementById('btnSimpanAbsen');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Menerapkan...';
  btn.disabled = true;

  App.fetchAPI('manualAttendanceMassal', payload, 'POST').then(res => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    
    if (res && res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res.message || 'Kehadiran massal berhasil diterapkan.',
        confirmButtonColor: '#10B981'
      });
    } else if (res && res.requireConfirmation) {
      Swal.fire({
        icon: 'warning',
        title: 'Sebagian Data Sudah Ada',
        text: res.message || 'Apakah Anda akan mengedit jam absensi mereka?',
        showCancelButton: true,
        confirmButtonText: 'Ya, Timpa Jam',
        cancelButtonText: 'Lewati Saja',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#9ca3af' // Grey color for skip
      }).then((result) => {
        if (result.isConfirmed) {
          // Force edit = true
          submitManualAbsenMassal(true);
        }
      });
    } else {
      App.showToast(res.message || 'Gagal menyimpan absensi massal', 'error');
    }
  }).catch(err => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    App.showToast('Terjadi kesalahan koneksi', 'error');
  });
}
