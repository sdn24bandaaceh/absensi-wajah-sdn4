document.addEventListener('DOMContentLoaded', function() {
  var calendarEl = document.getElementById('calendar');
  var calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'id',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek'
    },
    events: [], // Will be populated dynamically
    eventClick: function(info) {
      App.showToast(info.event.title + '<br><small>' + info.event.start.toLocaleDateString('id-ID') + '</small>', 'info');
    }
  });
  
  calendar.render();

  // Load holidays from backend
  loadCalendarEvents();

  function loadCalendarEvents() {
    App.fetchAPI('getDatabase', {}, 'GET').then(res => {
      if(res && res.success) {
        let events = [];
        
        // Load holidays
        if(res.data.settings.HOLIDAYS) {
          try {
            const holidays = JSON.parse(res.data.settings.HOLIDAYS);
            holidays.forEach(h => {
              const start = h.startDate || h.date;
              const endObj = new Date(h.endDate || h.date);
              endObj.setDate(endObj.getDate() + 1); // Exclusive end for FullCalendar
              
              events.push({
                title: h.name,
                start: start,
                end: endObj.toISOString().split('T')[0],
                color: '#EF4444', // Danger color for holidays
                allDay: true
              });
            });
          } catch(e) {
            console.error('Error parsing HOLIDAYS:', e);
          }
        }
        
        // Add events to calendar
        calendar.removeAllEvents();
        calendar.addEventSource(events);
      } else {
        App.showToast('Gagal memuat data kalender', 'error');
      }
    }).catch(err => {
      App.showToast('Koneksi bermasalah saat memuat kalender', 'error');
    });
  }
});
