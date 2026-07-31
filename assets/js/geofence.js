document.addEventListener('DOMContentLoaded', () => {
  // Load settings from API
  App.fetchAPI('getDatabase', {}, 'GET').then(res => {
    if (res && res.success && res.data && res.data.settings) {
       const s = res.data.settings;
       if (s.SCHOOL_LAT) document.getElementById('inputLat').value = s.SCHOOL_LAT.replace(/'/g, '');
       if (s.SCHOOL_LNG) document.getElementById('inputLng').value = s.SCHOOL_LNG.replace(/'/g, '');
       if (s.MAX_RADIUS_METERS) {
         document.getElementById('inputRadius').value = s.MAX_RADIUS_METERS;
         document.getElementById('radiusVal').innerText = `${s.MAX_RADIUS_METERS}m`;
       }
    }
    initGeofenceMap();
  }).catch(err => {
    initGeofenceMap(); // fallback
  });
  
  const formGeofence = document.getElementById('formGeofence');
  if (formGeofence) {
    formGeofence.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const btn = formGeofence.querySelector('button[type="submit"]');
      const originalHtml = btn.innerHTML;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Menyimpan...';
      btn.disabled = true;
      
      const payload = {
        settings: {
          SCHOOL_LAT: document.getElementById('inputLat').value,
          SCHOOL_LNG: document.getElementById('inputLng').value,
          MAX_RADIUS_METERS: document.getElementById('inputRadius').value
        }
      };
      
      App.fetchAPI('updateSettings', payload, 'POST').then(res => {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        if (res && res.success) {
           App.showToast('Pengaturan geofencing berhasil disimpan', 'success');
        } else {
           App.showToast(res.message || 'Gagal menyimpan', 'error');
        }
      }).catch(err => {
         btn.innerHTML = originalHtml;
         btn.disabled = false;
         App.showToast('Koneksi bermasalah', 'error');
      });
    });
  }
  
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
            
            document.getElementById('inputLat').value = lat.toFixed(6);
            document.getElementById('inputLng').value = lng.toFixed(6);
            
            if (typeof marker !== 'undefined' && marker && typeof circle !== 'undefined' && circle && typeof mapConfig !== 'undefined' && mapConfig) {
              const newPos = [lat, lng];
              marker.setLatLng(newPos);
              circle.setLatLng(newPos);
              mapConfig.setView(newPos, 16);
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
});

let mapConfig;
let marker;
let circle;

function initGeofenceMap() {
  const mapEl = document.getElementById('mapConfig');
  if (!mapEl) return;
  mapEl.classList.remove('skeleton');
  
  // Default values
  let lat = parseFloat(document.getElementById('inputLat').value);
  let lng = parseFloat(document.getElementById('inputLng').value);
  let radius = parseInt(document.getElementById('inputRadius').value);
  
  mapConfig = L.map('mapConfig').setView([lat, lng], 16);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapConfig);
  
  // Draggable Marker
  marker = L.marker([lat, lng], { draggable: true }).addTo(mapConfig);
  
  // Circle
  circle = L.circle([lat, lng], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.1,
    radius: radius
  }).addTo(mapConfig);
  
  // Marker drag event
  marker.on('dragend', function (e) {
    const position = marker.getLatLng();
    document.getElementById('inputLat').value = position.lat.toFixed(6);
    document.getElementById('inputLng').value = position.lng.toFixed(6);
    
    circle.setLatLng(position);
    mapConfig.panTo(position);
  });
  
  // Radius slider event
  const radiusSlider = document.getElementById('inputRadius');
  const radiusVal = document.getElementById('radiusVal');
  
  radiusSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    radiusVal.innerText = `${val}m`;
    circle.setRadius(parseInt(val));
  });
}
