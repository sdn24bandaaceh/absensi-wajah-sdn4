document.addEventListener('DOMContentLoaded', () => {
  const userRole = localStorage.getItem('userRole') || 'pegawai';
  if (userRole !== 'admin' && userRole !== 'superadmin') {
    App.showToast('Akses ditolak: Halaman Pengaturan Sistem hanya untuk Admin / Super Admin', 'error');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    return;
  }
  if (userRole !== 'superadmin') {
    const panelProfil = document.getElementById('panelProfilSekolah');
    if (panelProfil) {
      panelProfil.style.display = 'none';
      const appConfigPanel = document.getElementById('formAppConfig')?.closest('.col-lg-6');
      if (appConfigPanel) {
        appConfigPanel.classList.remove('col-lg-6');
        appConfigPanel.classList.add('col-lg-12');
      }
    }
  }

  let currentProfile = {};

  loadPengaturan();

  // Helper to convert File to Base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Handle Profil Sekolah Submit
  document.getElementById('formProfilSekolah').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    btnSubmit.disabled = true;

    try {
      const fileLogo = document.getElementById('profilLogo').files[0];
      const fileKop = document.getElementById('profilKopSurat').files[0];

      let base64Logo = currentProfile.logo || "";
      if (fileLogo) {
        base64Logo = await fileToBase64(fileLogo);
      }

      let base64Kop = currentProfile.kopSurat || "";
      if (fileKop) {
        base64Kop = await fileToBase64(fileKop);
      }

      const profileData = {
        nama: document.getElementById('profilNama').value,
        alamat: document.getElementById('profilAlamat').value,
        tingkat: document.getElementById('profilTingkat').value,
        status: document.getElementById('profilStatus').value,
        kepsek: document.getElementById('profilKepsek').value,
        nipKepsek: document.getElementById('profilNipKepsek').value,
        logo: base64Logo,
        kopSurat: base64Kop
      };

      const res = await App.fetchAPI('updateSchoolProfile', { profile: profileData }, 'POST');
      
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      if (res && res.success) {
        App.showToast('Profil sekolah berhasil diperbarui', 'success');
        // Reset file inputs
        document.getElementById('profilLogo').value = '';
        document.getElementById('profilKopSurat').value = '';
        currentProfile = profileData; // temporary update
        
        // Fetch fresh data from DB to get the Drive URLs and update UI
        loadPengaturan();
      } else {
        App.showToast('Gagal menyimpan profil', 'error');
      }
    } catch (error) {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      App.showToast('Terjadi kesalahan koneksi', 'error');
    }
  });

  // Handle App Config Submit
  document.getElementById('formAppConfig').addEventListener('submit', (e) => {
    e.preventDefault();
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalText = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
    btnSubmit.disabled = true;

    const configData = {
      liveness: document.getElementById('livenessSwitch').checked,
      multiDevice: document.getElementById('multiDeviceSwitch').checked,
      threshold: parseFloat(document.getElementById('aiThreshold').value)
    };

    const payload = {
      settings: {
        APP_CONFIG: JSON.stringify(configData)
      }
    };

    App.fetchAPI('updateSettings', payload, 'POST').then(res => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      if (res && res.success) {
        App.showToast('Pengaturan aplikasi diperbarui', 'success');
      } else {
        App.showToast('Gagal menyimpan pengaturan', 'error');
      }
    }).catch(err => {
      btnSubmit.innerHTML = originalText;
      btnSubmit.disabled = false;
      App.showToast('Koneksi bermasalah', 'error');
    });
  });

  function loadPengaturan() {
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if (res && res.success && res.data.settings) {
        // Load Profile
        if (res.data.settings.SCHOOL_PROFILE) {
          localStorage.setItem('schoolProfile', res.data.settings.SCHOOL_PROFILE);
          if (App.applySchoolProfile) App.applySchoolProfile();
          
          try {
            currentProfile = JSON.parse(res.data.settings.SCHOOL_PROFILE);
            document.getElementById('profilNama').value = currentProfile.nama || '';
            document.getElementById('profilAlamat').value = currentProfile.alamat || '';
            if (currentProfile.tingkat) document.getElementById('profilTingkat').value = currentProfile.tingkat;
            if (currentProfile.status) document.getElementById('profilStatus').value = currentProfile.status;
            document.getElementById('profilKepsek').value = currentProfile.kepsek || '';
            document.getElementById('profilNipKepsek').value = currentProfile.nipKepsek || '';
          } catch(e) {}
        }

        // Load Config
        if (res.data.settings.APP_CONFIG) {
          try {
            const config = JSON.parse(res.data.settings.APP_CONFIG);
            document.getElementById('livenessSwitch').checked = config.liveness === true;
            document.getElementById('multiDeviceSwitch').checked = config.multiDevice === true;
            document.getElementById('aiThreshold').value = config.threshold || 0.7;
          } catch(e) {}
        }
      }
    });
  }
});
