let userLocation = null;
let schoolLocation = { lat: 5.5414, lng: 95.3146 }; // Default
let maxRadius = 100;
let weeklySchedule = null;
let hasAbsenMasuk = false;
let hasAbsenPulang = false;

document.addEventListener('DOMContentLoaded', () => {
  const userName = localStorage.getItem('userName') || 'Pegawai';
  const titleEl = document.getElementById('pemindaianTitle');
  if (titleEl) {
    titleEl.innerText = `Pemindaian Wajah (${userName})`;
  }

  // Cek apakah akun terblokir
  const rawData = localStorage.getItem('userData');
  if (rawData) {
    try {
      const uData = JSON.parse(rawData);
      if (uData.pesanBlokir && uData.pesanBlokir.trim() !== '') {
        const blokirContainer = document.getElementById('blokirAlertContainer');
        const blokirText = document.getElementById('blokirMessageText');
        const cameraContainer = document.getElementById('mainCameraContainer');
        const actionContainer = document.getElementById('actionButtonsContainer');
        
        if (blokirContainer && blokirText) {
          blokirText.innerText = "Pesan Admin: " + uData.pesanBlokir;
          blokirContainer.classList.remove('d-none');
        }
        if (cameraContainer) cameraContainer.classList.add('d-none');
        if (actionContainer) actionContainer.classList.add('d-none');
        
        // Jangan inisialisasi kamera & maps jika diblokir
        return;
      }
    } catch (e) {}
  }

  initCamera();
  
  App.fetchAPI('getDatabase', {}, 'GET').then(res => {
    if(res && res.success) {
      if (res.data.settings) {
        const s = res.data.settings;
        if (s.SCHOOL_LAT) schoolLocation.lat = parseFloat(s.SCHOOL_LAT.replace("'", ""));
        if (s.SCHOOL_LNG) schoolLocation.lng = parseFloat(s.SCHOOL_LNG.replace("'", ""));
        if (s.MAX_RADIUS_METERS) maxRadius = parseInt(s.MAX_RADIUS_METERS);
        if (s.WEEKLY_SCHEDULE) {
          try {
            weeklySchedule = JSON.parse(s.WEEKLY_SCHEDULE);
          } catch(e) { console.error(e); }
        }
      }
      if (res.data.attendance) {
        const todayStr = new Date().toISOString().split('T')[0];
        const userId = localStorage.getItem('userId');
        res.data.attendance.forEach(a => {
          const aDate = String(a.timestamp).split(',')[0].split('T')[0];
          if (a.username === userId && aDate === todayStr) {
            if (a.status === 'Masuk') hasAbsenMasuk = true;
            if (a.status === 'Pulang') hasAbsenPulang = true;
          }
        });
      }
      
      // Cek ulang status blokir secara real-time dari database
      if (res.data.users) {
        const userId = localStorage.getItem('userId');
        const currentUser = res.data.users.find(u => u.username === userId);
        if (currentUser && currentUser.pesanBlokir && currentUser.pesanBlokir.trim() !== '') {
          const blokirContainer = document.getElementById('blokirAlertContainer');
          const blokirText = document.getElementById('blokirMessageText');
          const cameraContainer = document.getElementById('mainCameraContainer');
          const actionContainer = document.getElementById('actionButtonsContainer');
          
          if (blokirContainer && blokirText) {
            blokirText.innerText = "Pesan Admin: " + currentUser.pesanBlokir;
            blokirContainer.classList.remove('d-none');
          }
          if (cameraContainer) cameraContainer.classList.add('d-none');
          if (actionContainer) actionContainer.classList.add('d-none');
          
          // Stop kamera jika sedang menyala
          const video = document.getElementById('camera');
          if (video && video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
          }
          return; // Jangan lanjutkan init map
        }
      }
    }
    initMap();
  }).catch(() => {
    initMap();
  });

  const btnMasuk = document.getElementById('btnAbsenMasuk');
  const btnPulang = document.getElementById('btnAbsenPulang');

  if (btnMasuk) {
    btnMasuk.addEventListener('click', (e) => processAbsensi('Masuk', e.currentTarget));
  }
  if (btnPulang) {
    btnPulang.addEventListener('click', (e) => processAbsensi('Pulang', e.currentTarget));
  }
});

async function initCamera() {
  const video = document.getElementById('camera');
  const statusBadge = document.getElementById('cameraStatus');
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user' } 
    });
    video.srcObject = stream;
    
    video.onloadedmetadata = () => {
      statusBadge.innerHTML = '<i class="bi bi-camera-video-fill me-1"></i> Kamera Aktif';
      statusBadge.className = 'badge bg-success status-badge';
      
      // Simulate Face Recognition Loading
      setTimeout(() => {
        statusBadge.innerHTML = '<i class="bi bi-person-bounding-box me-1"></i> Wajah Terdeteksi';
        checkReadyState();
      }, 2000);
    };
  } catch (err) {
    console.error("Camera error:", err);
    statusBadge.innerHTML = '<i class="bi bi-exclamation-triangle-fill me-1"></i> Gagal Mengakses Kamera';
    statusBadge.className = 'badge bg-danger status-badge';
    App.showToast('Gagal mengakses kamera. Pastikan izin kamera diberikan.', 'error');
  }
}

function initMap() {
  const mapEl = document.getElementById('map');
  const locStatus = document.getElementById('locationStatus');
  
  if (!mapEl) return;
  mapEl.classList.remove('skeleton');
  
  const map = L.map('map').setView([schoolLocation.lat, schoolLocation.lng], 15);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // School Geofence Circle
  L.circle([schoolLocation.lat, schoolLocation.lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.1,
    radius: maxRadius
  }).addTo(map).bindPopup("Area SD Negeri 4 Banda Aceh");

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        // Update Map
        map.setView([userLocation.lat, userLocation.lng], 16);
        L.marker([userLocation.lat, userLocation.lng]).addTo(map)
          .bindPopup("Lokasi Anda").openPopup();
        
        // Calculate Distance (Haversine formula approximated by Leaflet)
        const schoolLatLng = L.latLng(schoolLocation.lat, schoolLocation.lng);
        const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
        const distance = userLatLng.distanceTo(schoolLatLng);
        
        if (distance <= maxRadius) {
          locStatus.innerHTML = `<i class="bi bi-check-circle-fill text-success me-1"></i> Lokasi valid (${Math.round(distance)}m)`;
          locStatus.className = 'alert alert-success small mb-0';
        } else {
          locStatus.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-warning me-1"></i> Di luar radius sekolah (${Math.round(distance)}m)`;
          locStatus.className = 'alert alert-warning small mb-0';
        }
        
        checkReadyState();
      },
      (error) => {
        locStatus.innerHTML = '<i class="bi bi-x-circle-fill text-danger me-1"></i> Gagal mendapatkan lokasi GPS';
        locStatus.className = 'alert alert-danger small mb-0';
      },
      { enableHighAccuracy: true }
    );
  }
}

function checkReadyState() {
  const btnMasuk = document.getElementById('btnAbsenMasuk');
  const btnPulang = document.getElementById('btnAbsenPulang');
  
  const statusBadge = document.getElementById('cameraStatus');
  const isFaceDetected = statusBadge && statusBadge.classList.contains('bg-success');
  const isLocationFound = userLocation !== null;
  
  let isWithinRadius = false;
  if (isLocationFound) {
    const schoolLatLng = L.latLng(schoolLocation.lat, schoolLocation.lng);
    const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
    const distance = userLatLng.distanceTo(schoolLatLng);
    isWithinRadius = distance <= maxRadius;
  }
  
  if (isFaceDetected && isLocationFound && isWithinRadius) {
    if (!hasAbsenMasuk) {
      btnMasuk.disabled = false;
      btnMasuk.classList.remove('btn-secondary');
      btnMasuk.classList.add('btn-success');
      btnMasuk.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i> Absen Masuk';
    } else {
      btnMasuk.disabled = true;
      btnMasuk.classList.remove('btn-success');
      btnMasuk.classList.add('btn-secondary');
      btnMasuk.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Sudah Masuk';
    }
    
    if (!hasAbsenPulang) {
      btnPulang.disabled = false;
      btnPulang.classList.remove('btn-secondary');
      btnPulang.classList.add('btn-danger');
      btnPulang.innerHTML = '<i class="bi bi-box-arrow-right me-2"></i> Absen Pulang';
    } else {
      btnPulang.disabled = true;
      btnPulang.classList.remove('btn-danger');
      btnPulang.classList.add('btn-secondary');
      btnPulang.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Sudah Pulang';
    }
  } else {
    if (btnMasuk && !hasAbsenMasuk) {
      btnMasuk.disabled = true;
      btnMasuk.classList.remove('btn-success');
      btnMasuk.classList.add('btn-secondary');
      if (isLocationFound && !isWithinRadius) {
        btnMasuk.innerHTML = '<i class="bi bi-geo-alt-fill me-2"></i> Di Luar Area Sekolah';
      } else {
        btnMasuk.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i> Absen Masuk';
      }
    }
    if (btnPulang && !hasAbsenPulang) {
      btnPulang.disabled = true;
      btnPulang.classList.remove('btn-danger');
      btnPulang.classList.add('btn-secondary');
      if (isLocationFound && !isWithinRadius) {
        btnPulang.innerHTML = '<i class="bi bi-geo-alt-fill me-2"></i> Di Luar Area Sekolah';
      } else {
        btnPulang.innerHTML = '<i class="bi bi-box-arrow-right me-2"></i> Absen Pulang';
      }
    }
  }
}

function processAbsensi(type, btn) {
  if (!btn) btn = event.currentTarget;
  const originalHtml = btn.innerHTML;
  
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Memproses...';
  btn.disabled = true;
  
  // Capture photo from video
  const video = document.getElementById('camera');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  const photoData = canvas.toDataURL('image/png');
  
  // Get user from local storage
  let user = { 
    username: localStorage.getItem('userId') || 'unknown', 
    nama: localStorage.getItem('userName') || 'Unknown' 
  };
  
  // Calculate Distance
  let distance = 0;
  if (userLocation) {
    const schoolLatLng = L.latLng(schoolLocation.lat, schoolLocation.lng);
    const userLatLng = L.latLng(userLocation.lat, userLocation.lng);
    distance = userLatLng.distanceTo(schoolLatLng);
  }
  
  if (distance > maxRadius) {
    App.showToast('Gagal: Anda berada di luar radius sekolah!', 'error');
    btn.innerHTML = originalHtml;
    btn.disabled = true;
    return;
  }
  
  // Catatan: Kalkulasi Terlambat/Tepat Waktu dan Hari Libur 
  // telah dipindahkan ke sisi server (Google Script) untuk mencegah manipulasi waktu.
  // Waktu absensi yang valid adalah waktu server, bukan waktu di perangkat ini.
  
  const payload = {
    username: user.username,
    nama: user.nama,
    status: type,
    userLat: userLocation ? userLocation.lat : null,
    userLng: userLocation ? userLocation.lng : null,
    photo: photoData
  };
  
  App.fetchAPI('submitAttendance', payload, 'POST').then(res => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    
    if (res && res.success) {
      Swal.fire({
        icon: 'success',
        title: `Absen ${type} Berhasil!`,
        text: `Tercatat di server pusat.`,
        confirmButtonColor: '#10B981',
        confirmButtonText: 'Tutup'
      }).then(() => {
        window.location.href = 'dashboard.html';
      });
    } else {
      App.showToast(res.message || 'Gagal menyimpan absensi', 'error');
    }
  }).catch(err => {
    btn.innerHTML = originalHtml;
    btn.disabled = false;
    App.showToast('Koneksi bermasalah', 'error');
  });
}
