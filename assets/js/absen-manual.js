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
  
  dateInput.value = now.toISOString().split('T')[0];
  timeInput.value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

  // Load users
  loadPegawai();

  // Handle form submit
  document.getElementById('formAbsenManual').addEventListener('submit', function(e) {
    e.preventDefault();
    submitManualAbsen();
  });
});

let usersList = [];

function loadPegawai() {
  App.fetchAPI('getDatabase', {}, 'GET').then(res => {
    if (res && res.success && res.data && res.data.users) {
      usersList = res.data.users;
      const select = document.getElementById('am_pegawai');
      select.innerHTML = '<option value="" disabled selected>-- Pilih Pegawai --</option>';
      
      usersList.forEach(u => {
        // Skip superadmin and admin if necessary, or let admin clock them too
        if (u.role === 'superadmin') return; 
        
        const option = document.createElement('option');
        option.value = u.username;
        option.textContent = `${u.nama} (${u.nip || '-'})`;
        select.appendChild(option);
      });
    } else {
      App.showToast('Gagal memuat daftar pegawai', 'error');
    }
  }).catch(() => {
    App.showToast('Koneksi bermasalah', 'error');
  });
}

function submitManualAbsen() {
  const username = document.getElementById('am_pegawai').value;
  const date = document.getElementById('am_tanggal').value;
  const time = document.getElementById('am_jam').value;
  const status = document.getElementById('am_status').value;
  const keterangan = document.getElementById('am_keterangan').value;

  if (!username || !date || !time || !status) {
    App.showToast('Mohon lengkapi semua field bertanda bintang (*)', 'warning');
    return;
  }

  const user = usersList.find(u => u.username === username);
  const nama = user ? user.nama : 'Unknown';

  const payload = {
    username: username,
    nama: nama,
    date: date,
    time: time,
    status: status,
    keterangan: keterangan
  };

  const btn = document.getElementById('btnSimpanAbsen');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Menyimpan...';
  btn.disabled = true;

  App.fetchAPI('manualAttendance', payload, 'POST').then(res => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    
    if (res && res.success) {
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: 'Kehadiran manual berhasil disimpan.',
        confirmButtonColor: '#10B981'
      }).then(() => {
        document.getElementById('am_keterangan').value = 'Lupa absen'; // reset ket
      });
    } else {
      App.showToast(res.message || 'Gagal menyimpan absensi manual', 'error');
    }
  }).catch(err => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    App.showToast('Terjadi kesalahan koneksi', 'error');
  });
}
