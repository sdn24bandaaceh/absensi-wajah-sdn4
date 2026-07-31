document.addEventListener('DOMContentLoaded', () => {
  let holidays = [];

  loadHolidays();

  let editIndex = -1;

  document.getElementById('btnCancel').addEventListener('click', () => {
    document.getElementById('formLibur').reset();
    editIndex = -1;
    document.getElementById('btnSubmit').textContent = 'Tambah';
    document.getElementById('btnCancel').classList.add('d-none');
  });

  document.getElementById('formLibur').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const startInput = document.getElementById('hl_start').value;
    const endInput = document.getElementById('hl_end').value;
    const descInput = document.getElementById('hl_desc').value;
    const typeInput = document.getElementById('hl_type').value;
    
    if (new Date(endInput) < new Date(startInput)) {
      App.showToast('Tanggal Selesai tidak boleh sebelum Tanggal Mulai', 'warning');
      return;
    }
    
    const newHoliday = {
      date: startInput, // Fallback
      startDate: startInput,
      endDate: endInput,
      name: descInput,
      type: typeInput
    };
    
    if (editIndex > -1) {
      holidays[editIndex] = newHoliday;
      editIndex = -1;
      document.getElementById('btnSubmit').textContent = 'Tambah';
      document.getElementById('btnCancel').classList.add('d-none');
    } else {
      holidays.push(newHoliday);
    }
    
    // Sort holidays by date
    holidays.sort((a, b) => new Date(a.startDate || a.date) - new Date(b.startDate || b.date));
    
    saveHolidays();
    e.target.reset();
  });

  function loadHolidays() {
    const listContainer = document.querySelector('.list-group');
    listContainer.innerHTML = '<div class="text-center p-3"><span class="spinner-border spinner-border-sm text-primary"></span> Memuat data...</div>';
    
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(res && res.success) {
        if(res.data.settings.HOLIDAYS) {
          try {
            holidays = JSON.parse(res.data.settings.HOLIDAYS);
          } catch(e) {
            holidays = [];
          }
        }
        renderHolidays();
      } else {
        listContainer.innerHTML = '<div class="text-center p-3 text-danger">Gagal memuat data hari libur</div>';
      }
    }).catch(err => {
      listContainer.innerHTML = '<div class="text-center p-3 text-danger">Koneksi bermasalah</div>';
    });
  }

  function renderHolidays() {
    const listContainer = document.querySelector('.list-group');
    listContainer.innerHTML = '';
    
    if(holidays.length === 0) {
      listContainer.innerHTML = '<div class="text-center p-3 text-muted">Belum ada data hari libur.</div>';
      return;
    }
    
    holidays.forEach((h, index) => {
      // Format date to Indonesian style
      const dateStartObj = new Date(h.startDate || h.date);
      const dateEndObj = new Date(h.endDate || h.date);
      const dateStartStr = dateStartObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const dateEndStr = dateEndObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      
      const dateDisplay = (dateStartStr === dateEndStr) ? dateStartStr : `${dateStartStr} - ${dateEndStr}`;
      
      const item = document.createElement('div');
      item.className = 'list-group-item bg-transparent d-flex justify-content-between align-items-center px-0 border-bottom border-light';
      item.innerHTML = `
        <div>
          <h6 class="mb-1 fw-bold text-danger">${dateDisplay}</h6>
          <small class="text-muted">${h.name}</small>
        </div>
        <div>
          <span class="badge bg-primary rounded-pill me-2">${h.type}</span>
          <button class="btn btn-sm btn-outline-secondary me-1" onclick="editHoliday(${index})"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteHoliday(${index})"><i class="bi bi-trash"></i></button>
        </div>
      `;
      listContainer.appendChild(item);
    });
  }

  window.editHoliday = function(index) {
    const h = holidays[index];
    document.getElementById('hl_start').value = h.startDate || h.date;
    document.getElementById('hl_end').value = h.endDate || h.date;
    document.getElementById('hl_desc').value = h.name;
    document.getElementById('hl_type').value = h.type;
    
    editIndex = index;
    document.getElementById('btnSubmit').textContent = 'Update';
    document.getElementById('btnCancel').classList.remove('d-none');
    
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  window.deleteHoliday = function(index) {
    if(confirm('Yakin ingin menghapus hari libur ini?')) {
      holidays.splice(index, 1);
      saveHolidays();
    }
  };

  function saveHolidays() {
    const btnSubmit = document.querySelector('#formLibur button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    btnSubmit.disabled = true;
    
    const payload = {
      action: 'updateSettings',
      settings: {
        HOLIDAYS: JSON.stringify(holidays)
      }
    };
    
    App.fetchAPI('updateSettings', payload, 'POST').then(res => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      
      if(res && res.success) {
        App.showToast('Data hari libur berhasil diperbarui', 'success');
        renderHolidays();
      } else {
        App.showToast('Gagal menyimpan hari libur', 'error');
        // Reload to get previous state
        loadHolidays();
      }
    }).catch(err => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      App.showToast('Koneksi bermasalah', 'error');
    });
  }
});
