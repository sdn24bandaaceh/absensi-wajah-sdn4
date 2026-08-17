document.addEventListener('DOMContentLoaded', () => {
  // Pastikan hanya admin yang bisa mengakses
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

  loadPermitsData();
});

let dataTable;

function loadPermitsData(forceRefresh = false) {
  if (forceRefresh) {
    App.clearDatabaseCache();
  }

  App.getDatabase(forceRefresh).then(res => {
    if (res && res.success && res.data) {
      renderTable(res.data.permits || []);
    } else {
      App.showToast('Gagal memuat data izin', 'error');
    }
  }).catch(() => {
    App.showToast('Koneksi bermasalah', 'error');
  });
}

function renderTable(permits) {
  if (dataTable) {
    dataTable.destroy();
  }

  const tbody = document.querySelector('#tableIzin tbody');
  tbody.innerHTML = '';

  // Sort dari yang terbaru (id terbesar)
  permits.sort((a, b) => parseInt(b.id) - parseInt(a.id));

  permits.forEach(p => {
    if (!p.id) return;

    let statusBadge = '';
    if (p.status === 'Menunggu Persetujuan') {
      statusBadge = '<span class="badge bg-warning text-dark"><i class="bi bi-clock-history me-1"></i>Menunggu</span>';
    } else if (p.status === 'Disetujui') {
      statusBadge = '<span class="badge bg-success"><i class="bi bi-check-circle me-1"></i>Disetujui</span>';
    } else if (p.status === 'Ditolak') {
      statusBadge = '<span class="badge bg-danger"><i class="bi bi-x-circle me-1"></i>Ditolak</span>';
    } else {
      statusBadge = `<span class="badge bg-secondary">${p.status}</span>`;
    }

    let actionButtons = '';
    if (p.status === 'Menunggu Persetujuan') {
      actionButtons = `
        <div class="d-flex gap-1 mb-1">
          <button class="btn btn-sm btn-success flex-fill" onclick="updateStatus('${p.id}', 'Disetujui')" title="Setujui">
            <i class="bi bi-check-lg"></i>
          </button>
          <button class="btn btn-sm btn-danger flex-fill" onclick="updateStatus('${p.id}', 'Ditolak')" title="Tolak">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary flex-fill" onclick="editPermit('${p.id}')" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger flex-fill" onclick="deletePermit('${p.id}')" title="Hapus">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
    } else {
      actionButtons = `
        <div class="mb-1">
          <button class="btn btn-sm btn-outline-secondary w-100" onclick="updateStatus('${p.id}', 'Menunggu Persetujuan')" title="Reset Status">
            <i class="bi bi-arrow-counterclockwise"></i> Reset
          </button>
        </div>
        <div class="d-flex gap-1">
          <button class="btn btn-sm btn-outline-primary flex-fill" onclick="editPermit('${p.id}')" title="Edit">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger flex-fill" onclick="deletePermit('${p.id}')" title="Hapus">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;
    }

    let attachmentLink = p.fileData ? `<a href="${p.fileData}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-paperclip"></i> Lihat</a>` : '<span class="text-muted small">Tidak ada</span>';

    // Simpan data mentah di atribut element atau object global untuk edit
    // Kita panggil window.allPermits untuk akses mudah
    if(!window.allPermits) window.allPermits = {};
    window.allPermits[p.id] = p;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div class="fw-bold">${formatTanggalPengajuan(p.tanggalPengajuan)}</div>
      </td>
      <td>
        <div class="fw-bold text-dark">${p.nama}</div>
        <div class="small text-muted">${p.username}</div>
      </td>
      <td><span class="badge bg-info text-dark">${p.tipe}</span></td>
      <td class="small">
        <div class="text-success"><i class="bi bi-calendar-check me-1"></i>${displayDate(p.tanggalMulai)}</div>
        <div class="text-danger mt-1"><i class="bi bi-calendar-x me-1"></i>${displayDate(p.tanggalSelesai)}</div>
      </td>
      <td class="small text-wrap" style="max-width: 200px;">${p.alasan}</td>
      <td>${attachmentLink}</td>
      <td>${statusBadge}</td>
      <td>${actionButtons}</td>
    `;
    tbody.appendChild(tr);
  });

  dataTable = $('#tableIzin').DataTable({
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/id.json'
    },
    order: [], // Matikan default order karena sudah disort di JS
    pageLength: 10
  });
}

function updateStatus(id, newStatus) {
  let actionText = newStatus === 'Disetujui' ? 'menyetujui' : (newStatus === 'Ditolak' ? 'menolak' : 'mereset');
  
  Swal.fire({
    title: 'Konfirmasi',
    text: `Anda yakin ingin ${actionText} pengajuan izin ini?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Proses',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      processUpdate(id, newStatus);
    }
  });
}

function processUpdate(id, status) {
  Swal.fire({
    title: 'Memproses...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  App.fetchAPI('updatePermitStatus', { id: id, status: status }, 'POST').then(res => {
    if (res && res.success) {
      Swal.fire('Berhasil!', `Status izin berhasil diperbarui menjadi ${status}.`, 'success');
      loadPermitsData(true);
    } else {
      Swal.fire('Gagal', res.message || 'Gagal mengupdate status', 'error');
    }
  }).catch(() => {
    Swal.fire('Error', 'Terjadi kesalahan koneksi', 'error');
  });
}

function formatTanggalPengajuan(dateStr) {
  if (!dateStr) return '<i class="text-muted">-</i>';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d)) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  } catch(e) {}
  return dateStr;
}

function displayDate(dateStr) {
  if(!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if(!isNaN(d)) return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch(e) {}
  return dateStr;
}

function parseDateForInput(dateStr) {
  if(!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if(!isNaN(d)) {
      // Return YYYY-MM-DD
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch(e) {}
  return dateStr; 
}

function editPermit(id) {
  const p = window.allPermits && window.allPermits[id];
  if(!p) return;
  
  document.getElementById('edit_id').value = p.id;
  document.getElementById('edit_tipe').value = p.tipe;
  document.getElementById('edit_mulai').value = parseDateForInput(p.tanggalMulai);
  document.getElementById('edit_selesai').value = parseDateForInput(p.tanggalSelesai);
  document.getElementById('edit_alasan').value = p.alasan;
  
  const modal = new bootstrap.Modal(document.getElementById('modalEditIzin'));
  modal.show();
}

document.getElementById('formEditIzin')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const payload = {
    action: 'updatePermit',
    id: document.getElementById('edit_id').value,
    tipe: document.getElementById('edit_tipe').value,
    tanggalMulai: document.getElementById('edit_mulai').value,
    tanggalSelesai: document.getElementById('edit_selesai').value,
    alasan: document.getElementById('edit_alasan').value
  };
  
  Swal.fire({
    title: 'Menyimpan...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  App.fetchAPI('updatePermit', payload, 'POST').then(res => {
    if (res && res.success) {
      const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditIzin'));
      modal.hide();
      Swal.fire('Berhasil!', 'Data izin berhasil diperbarui.', 'success');
      loadPermitsData(true);
    } else {
      Swal.fire('Gagal', res.message || 'Gagal menyimpan data.', 'error');
    }
  }).catch(() => {
    Swal.fire('Error', 'Terjadi kesalahan koneksi', 'error');
  });
});

function deletePermit(id) {
  Swal.fire({
    title: 'Hapus Pengajuan?',
    text: "Data pengajuan ini akan dihapus permanen!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Ya, Hapus!',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({
        title: 'Menghapus...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      App.fetchAPI('deletePermit', { id: id }, 'POST').then(res => {
        if (res && res.success) {
          Swal.fire('Terhapus!', 'Data izin telah dihapus.', 'success');
          loadPermitsData(true);
        } else {
          Swal.fire('Gagal', res.message || 'Gagal menghapus data.', 'error');
        }
      }).catch(() => {
        Swal.fire('Error', 'Terjadi kesalahan koneksi', 'error');
      });
    }
  });
}
