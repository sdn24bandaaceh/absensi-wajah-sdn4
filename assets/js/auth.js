document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      // Basic mock validation
      if (username && password) {
        // Simulate loading state
        const btn = loginForm.querySelector('button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...';
        btn.disabled = true;
        
        // Call API
        App.fetchAPI('login', { username, password }, 'GET').then(response => {
          if (response && response.success) {
            App.clearDatabaseCache();
            App.showToast('Login berhasil! Mengalihkan...', 'success');
            
            const user = response.user;
            let role = 'pegawai';
            const uname = user.username ? user.username.toLowerCase() : '';
            const userRole = user.role ? user.role.toLowerCase() : '';
            
            if (uname === 'superadmin' || userRole === 'superadmin') {
              role = 'superadmin';
            } else if (uname === 'admin' || uname === 'kepsek' || uname === 'operator' || userRole === 'admin') {
              role = 'admin';
            }
            
            // Save session
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', role);
            localStorage.setItem('userName', user.nama || username);
            localStorage.setItem('userId', user.username);
            localStorage.setItem('userData', JSON.stringify(user));
            
            if (response.schoolProfile) {
              localStorage.setItem('schoolProfile', JSON.stringify(response.schoolProfile));
            }
            if (response.adminToken) {
              localStorage.setItem('adminToken', response.adminToken);
            }
            
            setTimeout(() => {
              window.location.href = 'absensi.html';
            }, 1000);
          } else {
            App.showToast(response.message || 'Username atau password salah', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
          }
        }).catch(err => {
          App.showToast('Koneksi gagal', 'error');
          btn.innerHTML = originalText;
          btn.disabled = false;
        });
      } else {
        App.showToast('Username dan password harus diisi', 'error');
      }
    });
  }
});

// Logout function
function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  localStorage.removeItem('userData');
  localStorage.removeItem('adminToken');
  window.location.href = 'login.html';
}
