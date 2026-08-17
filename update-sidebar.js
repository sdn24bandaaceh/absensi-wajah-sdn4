const fs = require('fs');
const path = require('path');

const dir = __dirname;
const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const modulAbsensiLinks = [
  { href: 'absensi.html', icon: 'bi-camera-fill', text: 'Presensi Wajah' },
  { href: 'izin.html', icon: 'bi-envelope-paper-fill', text: 'Pengajuan Izin' },
  { href: 'riwayat.html', icon: 'bi-clock-history', text: 'Riwayat Absensi' }
];

const manajemenLinks = [
  { href: 'pegawai.html', icon: 'bi-people-fill', text: 'Data Pegawai' },
  { href: 'kelola-izin.html', icon: 'bi-envelope-check-fill', text: 'Kelola Izin' },
  { href: 'absen-manual.html', icon: 'bi-person-check-fill', text: 'Absen Manual' },
  { href: 'absen-massal.html', icon: 'bi-people-fill', text: 'Absen Massal' },
  { href: 'rekapitulasi.html', icon: 'bi-table', text: 'Rekapitulasi' },
  { href: 'laporan.html', icon: 'bi-file-earmark-bar-graph-fill', text: 'Laporan' },
  { href: 'foto-absensi.html', icon: 'bi-image', text: 'Foto Absensi' }
];

htmlFiles.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Skip files without a sidebar
  if (!content.includes('MANAJEMEN')) return;

  // Generate new MODUL ABSENSI section
  let newModulAbsensi = '<li class="nav-item mt-3 mb-1 px-4 text-muted small fw-bold">MODUL ABSENSI</li>\n';
  modulAbsensiLinks.forEach(link => {
    const activeClass = file === link.href ? ' active' : '';
    newModulAbsensi += `        <li class="nav-item">\n`;
    newModulAbsensi += `          <a class="nav-link${activeClass}" href="${link.href}"><i class="bi ${link.icon}"></i> ${link.text}</a>\n`;
    newModulAbsensi += `        </li>\n`;
  });

  // Generate new MANAJEMEN section
  let newManajemen = '<li class="nav-item mt-3 mb-1 px-4 text-muted small fw-bold">MANAJEMEN</li>\n';
  manajemenLinks.forEach(link => {
    const activeClass = file === link.href ? ' active' : '';
    newManajemen += `        <li class="nav-item">\n`;
    newManajemen += `          <a class="nav-link${activeClass}" href="${link.href}"><i class="bi ${link.icon}"></i> ${link.text}</a>\n`;
    newManajemen += `        </li>\n`;
  });

  // Replace everything between MODUL ABSENSI and PENGATURAN
  const regex = /<li class="nav-item mt-3 mb-1 px-4 text-muted small fw-bold">MODUL ABSENSI<\/li>[\s\S]*?(?=<li class="nav-item mt-3 mb-1 px-4 text-muted small fw-bold">PENGATURAN<\/li>)/;
  
  if (regex.test(content)) {
    content = content.replace(regex, newModulAbsensi + '        \n        ' + newManajemen + '        \n        ');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated sidebar in ${file}`);
  }
});

console.log('Sidebar updates complete!');
