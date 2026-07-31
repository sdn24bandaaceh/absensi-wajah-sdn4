document.addEventListener('DOMContentLoaded', () => {
  const days = [
    { id: 1, name: 'Senin' },
    { id: 2, name: 'Selasa' },
    { id: 3, name: 'Rabu' },
    { id: 4, name: 'Kamis' },
    { id: 5, name: 'Jumat' },
    { id: 6, name: 'Sabtu' },
    { id: 0, name: 'Minggu' }
  ];
  
  let scheduleData = {};

  loadSchedule();

  document.getElementById('formJamKerja').addEventListener('submit', (e) => {
    e.preventDefault();
    saveSchedule();
  });

  function loadSchedule() {
    const tbody = document.getElementById('jamKerjaBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-3"><span class="spinner-border spinner-border-sm text-primary"></span> Memuat...</td></tr>';
    
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(res && res.success) {
        if(res.data.settings.WEEKLY_SCHEDULE) {
          try {
            scheduleData = JSON.parse(res.data.settings.WEEKLY_SCHEDULE);
          } catch(e) {
            console.error(e);
          }
        }
        renderTable();
      } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger p-3">Gagal memuat jadwal</td></tr>';
      }
    }).catch(err => {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger p-3">Koneksi bermasalah</td></tr>';
    });
  }

  function renderTable() {
    const tbody = document.getElementById('jamKerjaBody');
    tbody.innerHTML = '';
    
    days.forEach(day => {
      const data = scheduleData[day.id] || { 
        entryStart: '07:00', entryEnd: '07:30', entryTol: 5, 
        exitStart: '14:00', exitEnd: '14:30', exitTol: 10, 
        libur: (day.id === 6 || day.id === 0) 
      };
      
      // Migration from old format
      if (data.jamMasuk && !data.entryStart) {
         data.entryStart = data.jamMasuk;
         data.entryEnd = data.jamMasuk;
         data.entryTol = data.toleransi || 0;
         data.exitStart = data.jamPulang;
         data.exitEnd = data.jamPulang;
         data.exitTol = data.toleransi || 0;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="fw-bold">${day.name}</td>
        <td class="text-center">
          <div class="form-check form-switch d-flex justify-content-center">
            <input class="form-check-input status-toggle" type="checkbox" data-day="${day.id}" ${!data.libur ? 'checked' : ''}>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <input type="time" class="form-control form-control-sm in-start" data-day="${day.id}" value="${data.entryStart}" ${data.libur ? 'disabled' : ''}>
            <span>-</span>
            <input type="time" class="form-control form-control-sm in-end" data-day="${day.id}" value="${data.entryEnd}" ${data.libur ? 'disabled' : ''}>
          </div>
        </td>
        <td><input type="number" class="form-control form-control-sm in-tol" data-day="${day.id}" value="${data.entryTol}" ${data.libur ? 'disabled' : ''} style="width:70px"></td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <input type="time" class="form-control form-control-sm out-start" data-day="${day.id}" value="${data.exitStart}" ${data.libur ? 'disabled' : ''}>
            <span>-</span>
            <input type="time" class="form-control form-control-sm out-end" data-day="${day.id}" value="${data.exitEnd}" ${data.libur ? 'disabled' : ''}>
          </div>
        </td>
        <td><input type="number" class="form-control form-control-sm out-tol" data-day="${day.id}" value="${data.exitTol}" ${data.libur ? 'disabled' : ''} style="width:70px"></td>
      `;
      tbody.appendChild(tr);
    });
    
    // Add event listeners for the toggles
    document.querySelectorAll('.status-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const dayId = e.target.getAttribute('data-day');
        const tr = e.target.closest('tr');
        const inputs = tr.querySelectorAll('input[type="time"], input[type="number"]');
        inputs.forEach(input => {
          input.disabled = !isChecked;
        });
      });
    });
  }

  function saveSchedule() {
    const btnSubmit = document.querySelector('#formJamKerja button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    btnSubmit.disabled = true;
    
    const newSchedule = {};
    document.querySelectorAll('#jamKerjaBody tr').forEach(tr => {
      const toggle = tr.querySelector('.status-toggle');
      const dayId = toggle.getAttribute('data-day');
      const libur = !toggle.checked;
      const inStart = tr.querySelector('.in-start').value;
      const inEnd = tr.querySelector('.in-end').value;
      const inTol = tr.querySelector('.in-tol').value;
      const outStart = tr.querySelector('.out-start').value;
      const outEnd = tr.querySelector('.out-end').value;
      const outTol = tr.querySelector('.out-tol').value;
      
      newSchedule[dayId] = {
        libur: libur,
        entryStart: libur ? '00:00' : inStart,
        entryEnd: libur ? '00:00' : inEnd,
        entryTol: libur ? 0 : parseInt(inTol),
        exitStart: libur ? '00:00' : outStart,
        exitEnd: libur ? '00:00' : outEnd,
        exitTol: libur ? 0 : parseInt(outTol)
      };
    });
    
    const payload = {
      action: 'updateSettings',
      settings: {
        WEEKLY_SCHEDULE: JSON.stringify(newSchedule)
      }
    };
    
    App.fetchAPI('updateSettings', payload, 'POST').then(res => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      
      if(res && res.success) {
        App.showToast('Konfigurasi jam kerja berhasil disimpan', 'success');
      } else {
        App.showToast('Gagal menyimpan jadwal', 'error');
      }
    }).catch(err => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      App.showToast('Koneksi bermasalah', 'error');
    });
  }
});
