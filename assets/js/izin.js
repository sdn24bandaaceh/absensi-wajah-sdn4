$(document).ready(function() {
  const table = $('#tableIzin').DataTable({
    language: {
      url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/id.json',
    },
    order: [[0, "desc"]]
  });

  // Load Izin data
  loadPermits();

  function loadPermits() {
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(res && res.success) {
        const permits = res.data.permits;
        const currentUsername = localStorage.getItem('userId');
        const role = localStorage.getItem('userRole');
        
        table.clear();
        permits.forEach(p => {
          // If pegawai, only show their own
          if (role !== 'admin' && p.username !== currentUsername) return;
          
          let statusBadge = '';
          if (p.status.includes('Menunggu')) statusBadge = `<span class="badge bg-warning text-dark"><i class="bi bi-hourglass me-1"></i> ${p.status}</span>`;
          else if (p.status.includes('Disetujui')) statusBadge = `<span class="badge bg-success"><i class="bi bi-check me-1"></i> ${p.status}</span>`;
          else statusBadge = `<span class="badge bg-danger"><i class="bi bi-x me-1"></i> ${p.status}</span>`;
          
          let actions = `<button class="btn btn-sm btn-light" onclick="viewPermit('${p.fileData}')"><i class="bi bi-eye"></i></button>`;
          if (p.status.includes('Menunggu')) {
             if (role === 'admin') {
               actions += `
                 <button class="btn btn-sm btn-success ms-1" onclick="updateStatus('${p.id}', 'Disetujui')" title="Setujui"><i class="bi bi-check-lg"></i></button>
                 <button class="btn btn-sm btn-danger ms-1" onclick="updateStatus('${p.id}', 'Ditolak')" title="Tolak"><i class="bi bi-x-lg"></i></button>
               `;
             } else {
               actions += ` <button class="btn btn-sm btn-danger text-white ms-1" disabled title="Menunggu admin"><i class="bi bi-trash"></i></button>`;
             }
          }
          
          // Tanggal Mulai dan Selesai
          const tglMulai = p.tanggalMulai ? new Date(p.tanggalMulai).toLocaleDateString('id-ID') : '-';
          const tglSelesai = p.tanggalSelesai ? new Date(p.tanggalSelesai).toLocaleDateString('id-ID') : '-';

          table.row.add([
            tglMulai, 
            `<span class="badge bg-info">${p.tipe}</span>`,
            `${tglMulai} s/d ${tglSelesai}`,
            statusBadge,
            actions
          ]);
        });
        table.draw();
      }
    });
  }

  document.getElementById('formIzin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Cek apakah akun terblokir
    const rawData = localStorage.getItem('userData');
    if (rawData) {
      try {
        const uData = JSON.parse(rawData);
        if (uData.pesanBlokir && uData.pesanBlokir.trim() !== '') {
          App.showToast('Anda tidak dapat mengajukan izin karena akses ditangguhkan: ' + uData.pesanBlokir, 'error');
          return;
        }
      } catch (err) {}
    }

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    
    const tipe = e.target.querySelector('select').value;
    const inputs = e.target.querySelectorAll('input[type="date"]');
    const mulai = inputs[0].value;
    const selesai = inputs[1].value;
    const alasan = e.target.querySelector('textarea').value;
    const fileInput = e.target.querySelector('input[type="file"]');
    
    let fileData = "";
    let fileName = "";
    
    if (fileInput.files.length > 0) {
       const file = fileInput.files[0];
       fileName = file.name;
       try {
         fileData = await getBase64(file);
       } catch(err) {
         App.showToast('Gagal memproses file', 'error');
         return;
       }
    }
    
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Mengirim...';
    btn.disabled = true;
    
    const payload = {
       username: localStorage.getItem('userId') || 'user_demo',
       nama: localStorage.getItem('userName') || 'User Demo',
       tipe, mulai, selesai, alasan, fileData, fileName
    };
    
    App.fetchAPI('submitPermit', payload, 'POST').then(res => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      if (res && res.success) {
        App.showToast('Pengajuan izin berhasil dikirim!', 'success');
        e.target.reset();
        loadPermits();
      } else {
        App.showToast('Gagal mengirim pengajuan', 'error');
      }
    }).catch(err => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      App.showToast('Koneksi bermasalah', 'error');
    });
  });

  function getBase64(file) {
     return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
     });
  }
});

window.viewPermit = function(url) {
  if (url && url.startsWith('http')) {
     window.open(url, '_blank');
  } else {
     Swal.fire('Info', 'File tidak tersedia atau masih dalam proses', 'info');
  }
};

window.updateStatus = function(id, newStatus) {
  Swal.fire({
    title: 'Konfirmasi',
    text: `Anda yakin ingin menandai pengajuan izin ini sebagai "${newStatus}"?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Lanjutkan',
    cancelButtonText: 'Batal'
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });
      App.fetchAPI('updatePermitStatus', { id: id, status: newStatus }, 'POST')
        .then(res => {
          if (res && res.success) {
             Swal.fire('Berhasil!', res.message, 'success').then(() => {
                location.reload();
             });
          } else {
             Swal.fire('Gagal', res.message || 'Terjadi kesalahan', 'error');
          }
        })
        .catch(err => Swal.fire('Error', 'Koneksi bermasalah', 'error'));
    }
  });
};
