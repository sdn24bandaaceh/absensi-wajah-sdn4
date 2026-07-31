let dtTugasLuar;
let mapTugasLuar;
let markerTL;
let circleTL;

document.addEventListener('DOMContentLoaded', () => {
  // Hanya admin yang boleh akses halaman ini
  if (App.userData && App.userData.role !== 'admin' && App.userData.role !== 'superadmin') {
    window.location.href = 'dashboard.html';
    return;
  }

  // Load Data
  loadData();

  // Setup Form Submit
  const formTugasLuar = document.getElementById('formTugasLuar');
  if (formTugasLuar) {
    formTugasLuar.addEventListener('submit', (e) => {
      e.preventDefault();
      saveTugasLuar();
    });
  }
  
  // Setup Location Button
  const btnGetCurrentLocation = document.getElementById('btnGetCurrentLocation');
  if (btnGetCurrentLocation) {
    btnGetCurrentLocation.addEventListener('click', () => {
      const originalHtml = btnGetCurrentLocation.innerHTML;
      btnGetCurrentLocation.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Mencari...';
      btnGetCurrentLocation.disabled = true;

      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            document.getElementById('tl_lat').value = lat.toFixed(6);
            document.getElementById('tl_lng').value = lng.toFixed(6);
            
            if (markerTL && circleTL && mapTugasLuar) {
              const newPos = [lat, lng];
              markerTL.setLatLng(newPos);
              circleTL.setLatLng(newPos);
              mapTugasLuar.setView(newPos, 16);
            }
            
            btnGetCurrentLocation.innerHTML = originalHtml;
            btnGetCurrentLocation.disabled = false;
            App.showToast('Lokasi terkini berhasil didapatkan', 'success');
          },
          (error) => {
            btnGetCurrentLocation.innerHTML = originalHtml;
            btnGetCurrentLocation.disabled = false;
            let msg = 'Gagal mendapatkan lokasi';
            if (error.code === error.PERMISSION_DENIED) msg = 'Akses lokasi ditolak oleh browser';
            App.showToast(msg, 'error');
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      } else {
        btnGetCurrentLocation.innerHTML = originalHtml;
        btnGetCurrentLocation.disabled = false;
        App.showToast('Browser Anda tidak mendukung GPS', 'error');
      }
    });
  }

  // Handle map resizing when modal opens
  const modalElement = document.getElementById('modalTugasLuar');
  if (modalElement) {
    modalElement.addEventListener('shown.bs.modal', function () {
      if (mapTugasLuar) {
        mapTugasLuar.invalidateSize();
      } else {
        initMapTugasLuar();
      }
    });
  }
});

function loadData() {
  App.fetchAPI('getDatabase', {}, 'GET').then(res => {
    if (res && res.success && res.data) {
      // Setup DataTable
      renderTable(res.data.tugasLuar || [], res.data.users || []);
      
      // Setup Pegawai Checkboxes (hanya yang aktif)
      const pegawai = (res.data.users || []).filter(u => u.username !== 'admin' && u.username !== 'superadmin');
      renderPegawaiCheckboxes(pegawai);
    } else {
      App.showToast('Gagal memuat data', 'error');
    }
  }).catch(err => {
    App.showToast('Gagal memuat data: ' + err, 'error');
  });
}

function renderTable(data, users) {
  if (dtTugasLuar) {
    dtTugasLuar.clear().destroy();
  }
  
  let tbody = document.querySelector('#tableTugasLuar tbody');
  if (!tbody) {
    const table = document.getElementById('tableTugasLuar');
    if (table) {
      tbody = document.createElement('tbody');
      table.appendChild(tbody);
    }
  }
  
  if (tbody) {
    tbody.innerHTML = '';
  } else {
    console.error("Table TugasLuar not found");
    return;
  }
  
  data.forEach((item, index) => {
    let namaPegawaiArr = [];
    if (item.pegawai && Array.isArray(item.pegawai)) {
       item.pegawai.forEach(uname => {
          const user = users.find(u => u.username === uname);
          if (user && user.nama) namaPegawaiArr.push(user.nama);
          else namaPegawaiArr.push(uname);
       });
    }
    const pegawaiText = namaPegawaiArr.length > 0 ? namaPegawaiArr.join(', ') : '-';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td class="fw-bold">${item.namaTugas}</td>
      <td>
        <span class="badge bg-light text-dark border"><i class="bi bi-calendar3 me-1"></i> ${App.formatDateIndonesia(item.tanggalMulai)}</span>
        <i class="bi bi-arrow-right mx-1 text-muted"></i>
        <span class="badge bg-light text-dark border"><i class="bi bi-calendar3 me-1"></i> ${App.formatDateIndonesia(item.tanggalSelesai)}</span>
      </td>
      <td><span class="badge bg-info">${item.radius}m</span></td>
      <td><small>${pegawaiText}</small></td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick='editTugasLuar(${JSON.stringify(item)})'>
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteTugasLuar('${item.id}', '${item.namaTugas}')">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    `;
    if (tbody) {
      tbody.appendChild(tr);
    }
  });
  
  dtTugasLuar = $('#tableTugasLuar').DataTable({
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/id.json',
      search: "_INPUT_",
      searchPlaceholder: "Cari data..."
    },
    dom: '<"row mb-3"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6 d-flex justify-content-end"f>>' +
         '<"row mb-2"<"col-sm-12"B>>' +
         'rt' +
         '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
    buttons: [
      {
        extend: 'excelHtml5',
        text: '<i class="bi bi-file-earmark-excel-fill me-1"></i> Excel',
        className: 'btn btn-sm btn-success',
        exportOptions: { columns: [0, 1, 2, 3, 4] }
      },
      {
        extend: 'pdfHtml5',
        text: '<i class="bi bi-file-earmark-pdf-fill me-1"></i> PDF',
        className: 'btn btn-sm btn-danger',
        orientation: 'landscape',
        pageSize: 'A4',
        exportOptions: { columns: [0, 1, 2, 3, 4] }
      },
      {
        extend: 'print',
        text: '<i class="bi bi-printer-fill me-1"></i> Cetak',
        className: 'btn btn-sm btn-secondary',
        exportOptions: { columns: [0, 1, 2, 3, 4] }
      }
    ]
  });
}

function renderPegawaiCheckboxes(pegawai) {
  const container = document.getElementById('tl_pegawai_list');
  if (!container) return;
  container.innerHTML = '';
  
  if (pegawai.length === 0) {
    container.innerHTML = '<div class="text-muted small">Tidak ada data pegawai.</div>';
    return;
  }
  
  pegawai.forEach(p => {
    const div = document.createElement('div');
    div.className = 'form-check mb-2';
    div.innerHTML = `
      <input class="form-check-input chk-pegawai" type="checkbox" value="${p.username}" id="chk_${p.username}">
      <label class="form-check-label d-flex align-items-center gap-2" for="chk_${p.username}">
        <img src="${p.foto}" class="rounded-circle" width="24" height="24" style="object-fit: cover;">
        <span>${p.nama} <small class="text-muted">(${p.nip})</small></span>
      </label>
    `;
    container.appendChild(div);
  });
}

function initMapTugasLuar() {
  const lat = document.getElementById('tl_lat').value || 5.5500;
  const lng = document.getElementById('tl_lng').value || 95.3175;
  const rad = document.getElementById('tl_radius').value || 100;
  
  mapTugasLuar = L.map('mapTugasLuar').setView([lat, lng], 16);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(mapTugasLuar);
  
  markerTL = L.marker([lat, lng], {draggable: true}).addTo(mapTugasLuar);
  circleTL = L.circle([lat, lng], {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.2,
    radius: rad
  }).addTo(mapTugasLuar);
  
  markerTL.on('dragend', function (e) {
    const newPos = e.target.getLatLng();
    document.getElementById('tl_lat').value = newPos.lat.toFixed(6);
    document.getElementById('tl_lng').value = newPos.lng.toFixed(6);
    circleTL.setLatLng(newPos);
  });
  
  // Bind slider
  document.getElementById('tl_radius').addEventListener('input', function() {
    if (circleTL) {
      circleTL.setRadius(this.value);
    }
  });
}

function openAddModal() {
  document.getElementById('formTugasLuar').reset();
  document.getElementById('tl_id').value = '';
  document.getElementById('tl_radius_val').innerText = '100m';
  
  // Uncheck all
  document.querySelectorAll('.chk-pegawai').forEach(chk => chk.checked = false);
  
  // Reset map view if it exists
  if (mapTugasLuar && markerTL && circleTL) {
    const lat = 5.5500;
    const lng = 95.3175;
    document.getElementById('tl_lat').value = lat;
    document.getElementById('tl_lng').value = lng;
    const newPos = [lat, lng];
    markerTL.setLatLng(newPos);
    circleTL.setLatLng(newPos);
    circleTL.setRadius(100);
    mapTugasLuar.setView(newPos, 16);
  }
  
  new bootstrap.Modal(document.getElementById('modalTugasLuar')).show();
}

function editTugasLuar(item) {
  document.getElementById('formTugasLuar').reset();
  
  document.getElementById('tl_id').value = item.id;
  document.getElementById('tl_nama').value = item.namaTugas;
  document.getElementById('tl_mulai').value = item.tanggalMulai.split('T')[0];
  document.getElementById('tl_selesai').value = item.tanggalSelesai.split('T')[0];
  document.getElementById('tl_lat').value = item.lat;
  document.getElementById('tl_lng').value = item.lng;
  document.getElementById('tl_radius').value = item.radius;
  document.getElementById('tl_radius_val').innerText = item.radius + 'm';
  
  // Uncheck all first
  document.querySelectorAll('.chk-pegawai').forEach(chk => chk.checked = false);
  
  // Check assigned
  if (item.pegawai && Array.isArray(item.pegawai)) {
    item.pegawai.forEach(uname => {
      const chk = document.getElementById('chk_' + uname);
      if (chk) chk.checked = true;
    });
  }
  
  // Update map if exists
  if (mapTugasLuar && markerTL && circleTL) {
    const newPos = [item.lat, item.lng];
    markerTL.setLatLng(newPos);
    circleTL.setLatLng(newPos);
    circleTL.setRadius(item.radius);
    mapTugasLuar.setView(newPos, 16);
  }
  
  new bootstrap.Modal(document.getElementById('modalTugasLuar')).show();
}

function saveTugasLuar() {
  const id = document.getElementById('tl_id').value;
  const action = id ? 'updateTugasLuar' : 'addTugasLuar';
  
  // Get checked employees
  const selectedPegawai = [];
  document.querySelectorAll('.chk-pegawai:checked').forEach(chk => {
    selectedPegawai.push(chk.value);
  });
  
  if (selectedPegawai.length === 0) {
    App.showToast('Silakan pilih minimal 1 pegawai untuk ditugaskan.', 'error');
    return;
  }
  
  const payload = {
    id: id,
    namaTugas: document.getElementById('tl_nama').value,
    lat: document.getElementById('tl_lat').value,
    lng: document.getElementById('tl_lng').value,
    radius: document.getElementById('tl_radius').value,
    tanggalMulai: document.getElementById('tl_mulai').value,
    tanggalSelesai: document.getElementById('tl_selesai').value,
    pegawai: selectedPegawai
  };
  
  const btn = document.getElementById('btnSaveTugas');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Menyimpan...';
  btn.disabled = true;
  
  App.fetchAPI(action, payload, 'POST').then(res => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    
    if (res && res.success) {
      bootstrap.Modal.getInstance(document.getElementById('modalTugasLuar')).hide();
      App.showToast(res.message, 'success');
      loadData(); // reload
    } else {
      App.showToast(res.message || 'Gagal menyimpan', 'error');
    }
  }).catch(err => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    App.showToast('Gagal terhubung ke server', 'error');
  });
}

function deleteTugasLuar(id, nama) {
  Swal.fire({
    title: 'Hapus Tugas Luar?',
    html: `Anda yakin ingin menghapus data <b>${nama}</b>?<br>Ini tidak akan menghapus absen pegawai yang telah terjadi di masa lalu.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Ya, Hapus!'
  }).then((result) => {
    if (result.isConfirmed) {
      App.showToast('Menghapus...', 'info');
      
      App.fetchAPI('deleteTugasLuar', { id: id }, 'POST').then(res => {
        if (res && res.success) {
          App.showToast(res.message, 'success');
          loadData();
        } else {
          App.showToast(res.message || 'Gagal menghapus', 'error');
        }
      }).catch(err => {
        App.showToast('Koneksi bermasalah', 'error');
      });
    }
  });
}
