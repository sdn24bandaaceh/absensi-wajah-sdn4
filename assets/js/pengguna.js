$(document).ready(function() {
  const table = $('#tablePengguna').DataTable({
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json',
    }
  });

  loadPengguna();

  function loadPengguna() {
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(res && res.success) {
        window.adminUsers = res.data.users.filter(u => u.role !== 'Peserta' && u.role !== '');
        
        table.clear();
        window.adminUsers.forEach((u, index) => {
          
          let roleBadge = `<span class="badge bg-secondary">${u.role}</span>`;
          if(u.role === 'Admin') roleBadge = `<span class="badge bg-danger">Administrator</span>`;
          else if(u.role === 'Kepala Sekolah') roleBadge = `<span class="badge bg-info">Kepala Sekolah</span>`;
          else if(u.role === 'Operator') roleBadge = `<span class="badge bg-primary">Operator</span>`;

          const btnReset = `<button class="btn btn-sm btn-warning text-white me-1" onclick="resetPassword('${u.username}')"><i class="bi bi-key"></i> Reset Pass</button>`;
          const btnDelete = u.username === 'admin' 
            ? `<button class="btn btn-sm btn-secondary" disabled><i class="bi bi-ban"></i></button>`
            : `<button class="btn btn-sm btn-danger" onclick="deleteAdmin('${u.username}')"><i class="bi bi-trash"></i></button>`;

          let rowStatus = `<span class="badge bg-success">Aktif</span>`;
          if (u.pesanBlokir && u.pesanBlokir.trim() !== '') {
            rowStatus = `<span class="badge bg-danger"><i class="bi bi-shield-lock"></i> Diblokir</span>`;
          }

          table.row.add([
            u.username,
            u.nama,
            roleBadge,
            rowStatus,
            btnReset + btnDelete
          ]);
        });
        table.draw();
      }
    });
  }

  document.getElementById('formTambahUser').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Menyimpan...';
    btn.disabled = true;

    const payload = {
      nama: document.getElementById('u_nama').value,
      username: document.getElementById('u_username').value,
      password: document.getElementById('u_password').value,
      role: document.getElementById('u_role').value,
      status: 'PNS', // Default status for admins
      jabatan: document.getElementById('u_role').value,
      foto: '',
      pesanBlokir: document.getElementById('u_pesan_blokir') ? document.getElementById('u_pesan_blokir').value : ''
    };

    App.fetchAPI('addUser', payload, 'POST').then(res => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      
      if (res && res.success) {
        App.showToast('Pengguna berhasil ditambahkan', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalTambahUser'));
        modal.hide();
        e.target.reset();
        loadPengguna();
      } else {
        App.showToast(res.message || 'Gagal menambahkan', 'error');
      }
    }).catch(err => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      App.showToast('Koneksi bermasalah', 'error');
    });
  });

  window.deleteAdmin = function(username) {
    if (confirm(`Yakin ingin menghapus pengguna dengan username: ${username}?`)) {
      App.fetchAPI('deleteUser', { username }, 'POST').then(res => {
        if (res.success) {
          App.showToast('Pengguna berhasil dihapus', 'success');
          loadPengguna();
        } else {
          App.showToast(res.message || 'Gagal menghapus', 'error');
        }
      });
    }
  };

  window.resetPassword = function(username) {
    const newPass = prompt("Masukkan password baru untuk " + username + ":");
    if (newPass && newPass.trim() !== '') {
      const user = window.adminUsers.find(u => u.username === username);
      if (user) {
        const payload = { ...user, password: newPass.trim() };
        
        App.fetchAPI('updateUser', payload, 'POST').then(res => {
          if (res.success) {
            App.showToast('Password berhasil direset', 'success');
          } else {
            App.showToast(res.message || 'Gagal reset password', 'error');
          }
        });
      }
    }
  };
});
