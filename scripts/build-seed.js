const fs = require('fs');
const path = require('path');

function parseSimpleCsv(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const header = parseCsvLine(lines[0]);
  const rows = [];
  let currentLine = '';
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() && !currentLine) continue;
    currentLine += (currentLine ? '\n' : '') + line;
    const quoteCount = (currentLine.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      const parsed = parseCsvLine(currentLine);
      if (parsed.length >= header.length - 1) {
        const obj = {};
        header.forEach((h, idx) => {
          obj[h.replace(/^\uFEFF/, '').trim()] = parsed[idx] !== undefined ? parsed[idx].trim() : '';
        });
        rows.push(obj);
      }
      currentLine = '';
    }
  }
  return { header: header.map(h => h.replace(/^\uFEFF/, '').trim()), rows };
}

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i+1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

// Helper to convert "June 17, 2025" -> "2025-06-17"
const monthMap = {
  january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
  july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
};

function parseDateStr(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim();
  if (!trimmed) return null;

  // Format: "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  // Format: "Month D, YYYY" or "Month DD, YYYY"
  const m = trimmed.match(/^([a-zA-Z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) {
    const month = monthMap[m[1].toLowerCase()];
    if (month) {
      const day = m[2].padStart(2, '0');
      const year = m[3];
      return `${year}-${month}-${day}`;
    }
  }

  // Format: "D Month YYYY"
  const m2 = trimmed.match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
  if (m2) {
    const month = monthMap[m2[2].toLowerCase()];
    if (month) {
      const day = m2[1].padStart(2, '0');
      const year = m2[3];
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

function parseDateRange(str) {
  if (!str) return { startDate: null, endDate: null, isRange: false };
  const parts = str.split('→').map(s => s.trim());
  if (parts.length === 2) {
    return {
      startDate: parseDateStr(parts[0]),
      endDate: parseDateStr(parts[1]),
      isRange: true
    };
  }
  const single = parseDateStr(str);
  return {
    startDate: single,
    endDate: single,
    isRange: false
  };
}

console.log('Building seed data...');

// 1. Process Daily Tasks
const tasksRaw = parseSimpleCsv(fs.readFileSync('extracted_data/DailyTasks/Daily Task Management 2137c205e4c28194a645f2140018944d_all.csv', 'utf8'));
const tasks = tasksRaw.rows.map((row, idx) => {
  const finishAt = parseDateStr(row['Finish at']);
  const progress = row.Progress || 'Not Started';
  return {
    id: `task-${idx + 1}`,
    name: row.Name || 'Untitled Task',
    activity: row.Activity || 'Administrasi',
    progress: progress,
    finishAt: finishAt,
    finishAtRaw: row['Finish at'] || '',
    statusKipApp: row['Status KipApp'] || 'Pending',
    note: row.Note || '',
    priority: progress === 'Very Urgent' ? 'High' : (row.Progress === 'Doing' ? 'Medium' : 'Low'),
    imageUrls: [],
    linkUrls: [],
    originStickyNoteId: null,
    eventId: null,
    createdAt: finishAt || '2025-06-01',
    updatedAt: finishAt || '2025-06-01'
  };
});
console.log(`Processed ${tasks.length} Daily Tasks.`);

// 2. Process Calendar & Events
const calRaw = parseSimpleCsv(fs.readFileSync('extracted_data/Kalender/Event And Calendar 2f57c205e4c2800aa7c9c58d01b5d174_New data source 2f57c205e4c280ef8576000b9dc0cec9_all.csv', 'utf8'));
const events = calRaw.rows.map((row, idx) => {
  const dates = parseDateRange(row.Date);
  const act = row.Activity || '';
  let type = 'event';
  if (act.toLowerCase().includes('libur') || row['Content name'].toLowerCase().includes('hari raya') || row['Content name'].toLowerCase().includes('tahun baru')) {
    type = 'holiday';
  } else if (act.toLowerCase().includes('cuti') || row['Content name'].toLowerCase().includes('cuti')) {
    type = 'leave';
  }
  return {
    id: `event-${idx + 1}`,
    title: row['Content name'] || 'Untitled Event',
    activity: act || (type === 'holiday' ? 'Libur Nasional' : (type === 'leave' ? 'Cuti Bersama' : 'Umum')),
    startDate: dates.startDate,
    endDate: dates.endDate,
    dateRaw: row.Date || '',
    isRange: dates.isRange,
    status: row.Status || 'Not Started',
    type: type,
    description: '',
    imageUrls: [],
    linkUrls: [],
    associatedTaskIds: []
  };
});
console.log(`Processed ${events.length} Calendar events.`);

// 3. Process Holidays from kalender_indonesia_2026_kalenderku.json
let extraHolidaysCount = 0;
try {
  const k2026 = JSON.parse(fs.readFileSync('kalender_indonesia_2026_kalenderku.json', 'utf8'));
  if (k2026.daftar_hari_libur_dan_peristiwa) {
    k2026.daftar_hari_libur_dan_peristiwa.forEach((h, hIdx) => {
      // Check if already in events by date and similar name
      const exists = events.some(e => e.startDate === h.tanggal && e.title.toLowerCase().includes(h.nama.toLowerCase().slice(0, 10)));
      if (!exists) {
        events.push({
          id: `holiday-2026-${hIdx + 1}`,
          title: h.nama,
          activity: h.jenis === 'cuti_bersama' ? 'Cuti Bersama' : 'Libur Nasional',
          startDate: h.tanggal,
          endDate: h.tanggal,
          dateRaw: h.tanggal,
          isRange: false,
          status: 'Not Started',
          type: h.jenis === 'cuti_bersama' ? 'leave' : 'holiday',
          description: `Hari libur resmi Indonesia 2026: ${h.nama} (${h.hari})`,
          imageUrls: [],
          linkUrls: [],
          associatedTaskIds: []
        });
        extraHolidaysCount++;
      }
    });
  }
} catch (e) {
  console.warn('Could not parse kalender_indonesia_2026:', e.message);
}
console.log(`Added ${extraHolidaysCount} additional 2026 holidays/leaves. Total calendar items: ${events.length}`);

// 4. Copy images to public/images and prepare Notes
const publicImagesDir = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(publicImagesDir, { recursive: true });

function copyRecursively(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      copyRecursively(srcPath, destDir);
    } else if (/\.(png|jpe?g|gif|webp|svg)$/i.test(entry.name)) {
      const cleanName = entry.name.replace(/\s+/g, '_');
      const parentName = path.basename(srcDir).replace(/[^\w-]/g, '_');
      const destFileName = `${parentName}_${cleanName}`;
      fs.copyFileSync(srcPath, path.join(destDir, destFileName));
    }
  }
}

copyRecursively('extracted_data/Note/Notes🤓', publicImagesDir);
if (fs.existsSync('extracted_data/DailyTasks/image.png')) {
  fs.copyFileSync('extracted_data/DailyTasks/image.png', path.join(publicImagesDir, 'DailyTasks_image.png'));
}
console.log('Public images prepared.');

// Process Notes
const notesRaw = parseSimpleCsv(fs.readFileSync('extracted_data/Note/Notes🤓 2137c205e4c28029872bf32b03c08fe3_all.csv', 'utf8'));
const notesDir = 'extracted_data/Note/Notes🤓';
const noteFiles = fs.existsSync(notesDir) ? fs.readdirSync(notesDir) : [];

const notes = notesRaw.rows.map((row, idx) => {
  const name = row.Name || 'Untitled Note';
  // Try to find matching markdown file
  let content = '';
  const matchingFile = noteFiles.find(f => f.endsWith('.md') && f.toLowerCase().startsWith(name.slice(0, 15).toLowerCase()));
  if (matchingFile) {
    try {
      content = fs.readFileSync(path.join(notesDir, matchingFile), 'utf8');
    } catch (_) {}
  }
  if (!content) {
    content = `# ${name}\n\nActivity: ${row.Activity || 'General'}\nCreated By: ${row['Created By'] || 'Ahmad Aulia'}\n\nNo detailed content provided.`;
  }

  // Extract links from content
  const links = [];
  const linkMatches = content.matchAll(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g);
  for (const lm of linkMatches) {
    links.push({ title: lm[1], url: lm[2] });
  }

  // Find images related
  const noteImages = [];
  const subfolderName = name;
  const subfolderPath = path.join(notesDir, subfolderName);
  if (fs.existsSync(subfolderPath) && fs.statSync(subfolderPath).isDirectory()) {
    const imgFiles = fs.readdirSync(subfolderPath).filter(f => /\.(png|jpe?g|gif|webp|svg)$/i.test(f));
    const parentSanitized = subfolderName.replace(/[^\w-]/g, '_');
    imgFiles.forEach(img => {
      const cleanName = img.replace(/\s+/g, '_');
      noteImages.push({
        name: img,
        url: `/images/${parentSanitized}_${cleanName}`
      });
    });
  }

  return {
    id: `note-${idx + 1}`,
    title: name,
    activity: row.Activity || 'General',
    createdAt: row.Created || '2025-06-15',
    createdBy: row['Created By'] || 'Ahmad Aulia',
    lastEditedTime: row['Last Edited Time'] || row.Created || '2025-06-15',
    content: content,
    images: noteImages,
    links: links,
    associatedTaskIds: []
  };
});
console.log(`Processed ${notes.length} Long-form Notes.`);

// 5. Create Initial Sticky Notes (capturing quick ideas and notes)
const initialStickyNotes = [
  {
    id: 'sticky-1',
    title: 'Cek revisi anggaran kegiatan Sakernas',
    content: 'Pastikan daftar belanja ATK dan translok sudah sesuai pedoman terbaru BPS.',
    area: 'Business',
    priority: 'High',
    status: 'In progress',
    date: '2026-11-05',
    completed: false,
    color: 'amber',
    convertedToTaskId: null,
    imageUrls: [],
    linkUrls: ['https://webbps.bps.go.id'],
    createdAt: '2026-11-01',
    updatedAt: '2026-11-02'
  },
  {
    id: 'sticky-2',
    title: 'Beli vitamin & stok obat keluarga',
    content: 'Cek persediaan vitamin C, madu, dan obat flu di apotek.',
    area: 'Family',
    priority: 'Medium',
    status: 'Not started',
    date: '2026-11-04',
    completed: false,
    color: 'emerald',
    convertedToTaskId: null,
    imageUrls: [],
    linkUrls: [],
    createdAt: '2026-11-02',
    updatedAt: '2026-11-02'
  },
  {
    id: 'sticky-3',
    title: 'Riset ide konten side-hustle data analytics',
    content: 'Bikin template spreadsheet visualisasi data UMKM dan tutorial di LinkedIn.',
    area: 'Side Hustle',
    priority: 'Low',
    status: 'Not started',
    date: null,
    completed: false,
    color: 'sky',
    convertedToTaskId: null,
    imageUrls: [],
    linkUrls: [],
    createdAt: '2026-11-02',
    updatedAt: '2026-11-02'
  },
  {
    id: 'sticky-4',
    title: 'Backup database laptop kerja bulanan',
    content: 'Pindahkan file arsip laporan ke harddisk eksternal dan cloud drive.',
    area: 'Personal',
    priority: 'Medium',
    status: 'Done',
    date: '2026-11-01',
    completed: true,
    color: 'purple',
    convertedToTaskId: 'task-converted-sample',
    imageUrls: [],
    linkUrls: [],
    createdAt: '2026-10-30',
    updatedAt: '2026-11-01'
  }
];

// 6. Resources / Links Collection
const initialResources = [
  {
    id: 'res-1',
    title: 'Portal SSO BPS',
    url: 'https://sso.bps.go.id',
    category: 'Sistem Kerja',
    description: 'Portal Single Sign On untuk aplikasi internal BPS',
    tags: ['SSO', 'BPS', 'Login'],
    createdAt: '2025-06-15'
  },
  {
    id: 'res-2',
    title: 'Fasih BPS Online',
    url: 'https://fasih.bps.go.id',
    category: 'Survei & Sensus',
    description: 'Platform pendataan dan approval survei lapangan',
    tags: ['Fasih', 'Sakernas', 'Susenas', 'Supas'],
    createdAt: '2025-06-16'
  },
  {
    id: 'res-3',
    title: 'KipApp BPS',
    url: 'https://kipapp.bps.go.id',
    category: 'Kinerja',
    description: 'Aplikasi pelaporan SKP dan kinerja pegawai bulanan',
    tags: ['KipApp', 'SKP', 'Administrasi'],
    createdAt: '2025-06-16'
  },
  {
    id: 'res-4',
    title: 'Kalender Indonesia 2026 & Hari Libur',
    url: 'https://kalenderku.id/',
    category: 'Referensi Kalender',
    description: 'Daftar resmi hari libur nasional dan cuti bersama 2026',
    tags: ['Kalender', 'Libur', '2026'],
    createdAt: '2026-01-01'
  }
];

// Save combined seed data
const outputDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(outputDir, { recursive: true });

const seedData = {
  tasks,
  events,
  notes,
  stickyNotes: initialStickyNotes,
  resources: initialResources,
  metadata: {
    generatedAt: new Date().toISOString(),
    totalTasks: tasks.length,
    totalEvents: events.length,
    totalNotes: notes.length,
    totalStickyNotes: initialStickyNotes.length,
    totalResources: initialResources.length
  }
};

fs.writeFileSync(path.join(outputDir, 'seed-data.json'), JSON.stringify(seedData, null, 2), 'utf8');
console.log('Successfully generated data/seed-data.json!');
console.log('Seed summary:', seedData.metadata);

