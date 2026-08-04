const App = {
  // PENTING: Ganti URL ini dengan URL eksekusi Web App dari Google Apps Script Anda!
  // Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'
  API_URL: 'https://script.google.com/macros/s/AKfycbyTz21eXrnbxJNF58xXCqHMy5Nqe_2sd73UvTdGdy-1OOeWINTr0NL0RYHGN-3R44m9dw/exec',

  init() {
    this.initDarkMode();
    this.initTooltips();
    this.initAOS();
    this.applySchoolProfile();
    this.initUserNav();
    this.restrictAdminPages();
    this.hideAdminMenus();
  },

  getDirectImageUrl(url) {
    if (!url) return '';
    // Convert Google Drive view URL to direct image URL
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      // Menggunakan URL thumbnail yang lebih stabil untuk tag <img>
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w500`;
    }
    return url;
  },

  applySchoolProfile() {
    const profileStr = localStorage.getItem('schoolProfile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        const logoUrl = this.getDirectImageUrl(profile.logo);

        // Update sidebar names
        const sidebarTitles = document.querySelectorAll('.sidebar-header h6');
        sidebarTitles.forEach(el => {
          if (profile.nama) el.textContent = profile.nama;
        });

        // Update login page name
        const loginSubtitle = document.querySelector('.login-card p');
        if (loginSubtitle && profile.nama) {
          loginSubtitle.textContent = profile.nama;
        }

        // Update logo in sidebar
        const sidebarIcons = document.querySelectorAll('.sidebar-header i.bi-shield-lock-fill');
        sidebarIcons.forEach(el => {
          if (logoUrl) {
            const img = document.createElement('img');
            img.src = logoUrl;
            img.style.width = '40px';
            img.style.height = '40px';
            img.style.objectFit = 'contain';
            img.className = 'me-2';
            el.parentNode.replaceChild(img, el);
          }
        });

        // Update existing img logo in sidebar
        const sidebarImgs = document.querySelectorAll('.sidebar-header img.me-2');
        sidebarImgs.forEach(el => {
          if (logoUrl) el.src = logoUrl;
        });

        // Update logo in login page
        const loginIcon = document.querySelector('.login-card .bi-shield-lock');
        if (loginIcon && logoUrl) {
          const img = document.createElement('img');
          img.src = logoUrl;
          img.style.width = '80px';
          img.style.height = '80px';
          img.style.objectFit = 'contain';
          img.className = 'mb-2';
          loginIcon.parentNode.replaceChild(img, loginIcon);
        }
        // Update existing img logo in login page
        const loginImg = document.querySelector('.login-card img.mb-2');
        if (loginImg && logoUrl) {
          loginImg.src = logoUrl;
        }

        // Update document title
        if (profile.nama) {
          document.title = document.title.replace('SDN 24 Banda Aceh', profile.nama).replace('SD Negeri 24 Banda Aceh', profile.nama);
        }
      } catch (e) { }
    }
  },

  async fetchAPI(action, payload = {}, method = 'POST') {
    try {
      // Inject admin token and user ID if available
      const userId = localStorage.getItem('userId');
      const adminToken = localStorage.getItem('adminToken');

      if (userId && !payload.requestUserId) payload.requestUserId = userId;
      if (adminToken && !payload.adminToken) payload.adminToken = adminToken;

      if (method === 'GET') {
        const queryParams = new URLSearchParams({ action, ...payload, _t: Date.now() }).toString();
        const response = await fetch(`${this.API_URL}?${queryParams}`);
        return await response.json();
      } else {
        const response = await fetch(this.API_URL, {
          method: 'POST',
          body: JSON.stringify({ action, ...payload }),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          }
        });
        return await response.json();
      }
    } catch (error) {
      console.error('API Error:', error);
      return { success: false, message: 'Koneksi ke server gagal' };
    }
  },

  initDarkMode() {
    const toggleBtn = document.getElementById('darkModeToggle');
    if (!toggleBtn) return;

    // Check local storage or system preference
    const currentTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (currentTheme === 'dark' || (!currentTheme && prefersDark)) {
      document.body.classList.add('dark-mode');
      toggleBtn.innerHTML = '<i class="bi bi-sun-fill"></i>';
    }

    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      toggleBtn.innerHTML = isDark ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-stars-fill"></i>';
    });
  },

  initTooltips() {
    if (typeof bootstrap !== 'undefined') {
      const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
      [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
  },

  initAOS() {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 800,
        once: true,
        offset: 50
      });
    }
  },

  showToast(message, type = 'success') {
    if (typeof Swal !== 'undefined') {
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({
        icon: type,
        title: message
      });
    } else {
      alert(message);
    }
  },

  initUserNav() {
    const userName = localStorage.getItem('userName') || 'User';
    const userRole = localStorage.getItem('userRole') || 'pegawai';
    const userId = localStorage.getItem('userId') || '';

    const displayNameEl = document.getElementById('displayName');
    if (displayNameEl && userName !== 'Admin' && userName !== 'User') {
      displayNameEl.textContent = userName.charAt(0).toUpperCase() + userName.slice(1);
    }

    const displayRoleEl = document.querySelector('.user-profile small.text-muted');
    if (displayRoleEl) {
      if (userRole === 'superadmin') displayRoleEl.textContent = 'Super Admin';
      else if (userRole === 'admin') displayRoleEl.textContent = 'Administrator';
      else displayRoleEl.textContent = 'Pegawai';
    }

    const userAvatarEl = document.querySelector('.user-profile img');
    if (userAvatarEl) {
      userAvatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0D8ABC&color=fff`;
    }

    const profileLinks = document.querySelectorAll('a.dropdown-item');
    profileLinks.forEach(link => {
      if (link.textContent.includes('Pengaturan Profil')) {
        link.href = '#';
        link.onclick = (e) => {
          e.preventDefault();
          this.showProfileModal();
        };
      }
    });

    const userProfileBox = document.querySelector('.user-profile');
    if (userProfileBox && !userProfileBox.classList.contains('dropdown')) {
      userProfileBox.style.cursor = 'pointer';
      userProfileBox.title = 'Klik untuk melihat / mengubah Profil Saya';
      userProfileBox.addEventListener('click', () => {
        this.showProfileModal();
      });
    }
  },

  previewMyProfileFoto(inputEl) {
    if (inputEl.files && inputEl.files[0]) {
      const file = inputEl.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.showToast('Ukuran foto terlalu besar (Maksimal 5MB)', 'error');
        inputEl.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result;
        this._tempProfileFotoBase64 = base64;
        const imgEl = document.getElementById('myProfileAvatarPreview');
        if (imgEl) imgEl.src = base64;
      };
      reader.readAsDataURL(file);
    }
  },

  showProfileModal() {
    this._tempProfileFotoBase64 = null;
    let modalEl = document.getElementById('modalUserProfile');
    if (modalEl) {
      modalEl.remove();
    }

    const modalHtml = `
    <div class="modal fade" id="modalUserProfile" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content glass-card border-0 p-3">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold"><i class="bi bi-person-circle me-2 text-primary"></i>Profil Saya</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body text-center pt-2">
            <div class="position-relative d-inline-block mb-2">
              <img id="myProfileAvatarPreview" src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff&size=90" class="rounded-circle shadow" width="90" height="90" style="object-fit: cover; border: 3px solid rgba(13,138,188,0.3);">
            </div>
            <div>
              <label for="inputMyProfileFoto" class="btn btn-sm btn-outline-primary mb-2" style="font-size: 0.75rem; border-radius: 20px;"><i class="bi bi-camera me-1"></i>Ganti Foto / Avatar</label>
              <input type="file" id="inputMyProfileFoto" class="d-none" accept="image/*" onchange="App.previewMyProfileFoto(this)">
            </div>
            <div class="mb-3">
              <span class="badge bg-primary px-3 py-1" id="myProfileRoleBadge" style="font-size: 0.75rem;">PEGAWAI</span>
            </div>
            
            <div class="text-start bg-light p-3 rounded mb-3 text-dark style-dark-fix" style="background: rgba(255,255,255,0.05) !important;">
              <div class="row g-2">
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted mb-1">Nama Lengkap</label>
                  <input type="text" class="form-control form-control-sm" id="inputMyProfileNama" placeholder="Nama lengkap...">
                </div>
                <div class="col-6">
                  <label class="form-label small fw-bold text-muted mb-1">NIP</label>
                  <input type="text" class="form-control form-control-sm" id="inputMyProfileNip" placeholder="NIP...">
                </div>
                <div class="col-6">
                  <label class="form-label small fw-bold text-muted mb-1">Pangkat / Gol</label>
                  <input type="text" class="form-control form-control-sm" id="inputMyProfilePangkat" placeholder="Contoh: III/a...">
                </div>
                <div class="col-12 border-top pt-2 mt-2">
                  <label class="form-label small fw-bold text-muted mb-1"><i class="bi bi-person-badge me-1"></i>Username (Akun Login)</label>
                  <input type="text" class="form-control form-control-sm" id="inputMyProfileUsername" placeholder="Username login...">
                </div>
                <div class="col-12">
                  <label class="form-label small fw-bold text-muted mb-1"><i class="bi bi-key me-1"></i>Ubah Kata Sandi (Password)</label>
                  <input type="password" class="form-control form-control-sm" id="inputMyProfilePassword" placeholder="Masukkan password baru...">
                  <small class="text-muted d-block mt-1" style="font-size: 0.7rem;">Biarkan kosong jika tidak ingin mengubah kata sandi Anda.</small>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer border-0 pt-0 justify-content-between">
            <button type="button" class="btn btn-secondary btn-sm px-3" data-bs-dismiss="modal">Tutup</button>
            <button type="button" class="btn btn-primary btn-sm px-4" onclick="App.saveMyProfile(this)"><i class="bi bi-save me-1"></i>Simpan Perubahan</button>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    modalEl = document.getElementById('modalUserProfile');

    const userName = localStorage.getItem('userName') || 'User';
    const userRole = localStorage.getItem('userRole') || 'pegawai';
    const userId = localStorage.getItem('userId') || '';
    let userData = {};
    try {
      userData = JSON.parse(localStorage.getItem('userData') || '{}');
    } catch (e) { }

    document.getElementById('myProfileRoleBadge').textContent = userRole.toUpperCase();
    document.getElementById('inputMyProfileNama').value = userData.nama || userName;
    document.getElementById('inputMyProfileNip').value = userData.nip || (userId.match(/^\d+$/) ? userId : '');
    document.getElementById('inputMyProfilePangkat').value = userData.pangkat || '';
    document.getElementById('inputMyProfileUsername').value = userData.username || userId;

    let fUrl = userData.foto;
    if (fUrl && fUrl.includes('/d/')) fUrl = this.getDirectImageUrl(fUrl);
    document.getElementById('myProfileAvatarPreview').src = fUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nama || userName)}&background=0D8ABC&color=fff&size=90`;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    if (userId) {
      this.fetchAPI('getMyProfile', { username: userId }, 'GET').then(res => {
        if (res && res.success && res.user) {
          localStorage.setItem('userData', JSON.stringify(res.user));
          const u = res.user;
          const elNama = document.getElementById('inputMyProfileNama');
          const elNip = document.getElementById('inputMyProfileNip');
          const elPangkat = document.getElementById('inputMyProfilePangkat');
          const elUname = document.getElementById('inputMyProfileUsername');
          const elImg = document.getElementById('myProfileAvatarPreview');

          if (elNama && document.activeElement !== elNama) elNama.value = u.nama || '';
          if (elNip && document.activeElement !== elNip) elNip.value = u.nip || '';
          if (elPangkat && document.activeElement !== elPangkat) elPangkat.value = u.pangkat || '';
          if (elUname && document.activeElement !== elUname) elUname.value = u.username || '';
          if (elImg && !this._tempProfileFotoBase64) {
            let uFoto = u.foto;
            if (uFoto && uFoto.includes('/d/')) uFoto = this.getDirectImageUrl(uFoto);
            elImg.src = uFoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nama || userName)}&background=0D8ABC&color=fff&size=90`;
          }
        }
      }).catch(e => console.log('Silakan deploy backend untuk sinkronisasi profil otomatis'));
    }
  },

  async saveMyProfile(btnEl) {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      this.showToast('Sesi tidak valid, silakan login ulang.', 'error');
      return;
    }

    const nama = document.getElementById('inputMyProfileNama')?.value?.trim();
    const nip = document.getElementById('inputMyProfileNip')?.value?.trim();
    const pangkat = document.getElementById('inputMyProfilePangkat')?.value?.trim();
    const username = document.getElementById('inputMyProfileUsername')?.value?.trim();
    const password = document.getElementById('inputMyProfilePassword')?.value?.trim();

    if (!nama || !username) {
      this.showToast('Nama Lengkap dan Username wajib diisi!', 'error');
      return;
    }

    const payload = {
      oldUsername: currentUserId,
      nama: nama,
      nip: nip,
      pangkat: pangkat,
      newUsername: username,
      password: password || ""
    };

    if (this._tempProfileFotoBase64) {
      payload.foto = this._tempProfileFotoBase64;
    }

    const originalText = btnEl.innerHTML;
    btnEl.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';
    btnEl.disabled = true;

    try {
      const res = await this.fetchAPI('updateMyProfile', payload, 'POST');
      btnEl.innerHTML = originalText;
      btnEl.disabled = false;

      if (res && res.success) {
        this.showToast('Profil berhasil diperbarui!', 'success');

        if (res.user) {
          localStorage.setItem('userName', res.user.nama || res.user.username);
          localStorage.setItem('userId', res.user.username);
          localStorage.setItem('userRole', res.user.role || 'pegawai');
          localStorage.setItem('userData', JSON.stringify(res.user));

          const displayNameEl = document.getElementById('displayName');
          if (displayNameEl) displayNameEl.textContent = res.user.nama;

          const userAvatarEl = document.querySelector('.user-profile img');
          if (userAvatarEl) {
            let fUrl = res.user.foto;
            if (fUrl && fUrl.includes('/d/')) fUrl = this.getDirectImageUrl(fUrl);
            userAvatarEl.src = fUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(res.user.nama)}&background=0D8ABC&color=fff`;
          }
        }

        const modalEl = document.getElementById('modalUserProfile');
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();

        if ((password && password !== "") || (username !== currentUserId)) {
          this.showToast('Username / Kata Sandi diubah. Silakan login kembali...', 'info');
          setTimeout(() => {
            if (typeof logout === 'function') logout();
            else {
              localStorage.clear();
              window.location.href = 'login.html';
            }
          }, 1500);
        }
      } else {
        this.showToast(res.message || 'Gagal memperbarui profil.', 'error');
      }
    } catch (err) {
      btnEl.innerHTML = originalText;
      btnEl.disabled = false;
      this.showToast('Terjadi kesalahan koneksi.', 'error');
    }
  },

  restrictAdminPages() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop();
    const adminPages = [
      'pegawai.html', 'rekapitulasi.html', 'laporan.html',
      'geofencing.html', 'jam-kerja.html', 'hari-libur.html',
      'pengguna.html', 'pengaturan.html'
    ];
    const userRole = localStorage.getItem('userRole') || 'pegawai';

    if (adminPages.includes(currentPage) && userRole !== 'admin' && userRole !== 'superadmin') {
      this.showToast('Anda tidak memiliki akses ke halaman ini', 'error');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    }
  },

  hideAdminMenus() {
    const userRole = localStorage.getItem('userRole') || 'pegawai';
    if (userRole === 'admin' || userRole === 'superadmin') return;

    const sidebarNav = document.querySelector('.sidebar .nav, #sidebar .nav, .nav-pills, .nav');
    if (!sidebarNav) return;

    let shouldHide = false;
    const items = sidebarNav.querySelectorAll('.nav-item, a.nav-link');

    items.forEach(item => {
      const text = item.textContent || '';
      if (text.includes('MANAJEMEN') || text.includes('PENGATURAN')) {
        shouldHide = true;
        item.style.display = 'none';
        return;
      }
      if (text.includes('Logout')) {
        shouldHide = false;
        return;
      }
      if (shouldHide || text.includes('Profil Sekolah') || text.includes('Pengaturan Sistem') || text.includes('Data Pegawai') || text.includes('Rekapitulasi') || text.includes('Laporan') || text.includes('Geofencing') || text.includes('Jam Kerja') || text.includes('Hari Libur') || text.includes('Pengguna') || text.includes('Absen Manual')) {
        item.style.display = 'none';
        if (item.closest('.nav-item')) item.closest('.nav-item').style.display = 'none';
      }
    });
  },

  formatDateIndonesia(dateString) {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString('id-ID', options);
    } catch (e) {
      return dateString;
    }
  }
};

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
