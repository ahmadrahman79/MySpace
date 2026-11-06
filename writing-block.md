# PROJECT: Integrated Personal Productivity System in Notion

## 1. Peran dan Tujuan

Bertindak sebagai Senior Notion Architect, Productivity System Designer, dan Automation Engineer.

Tugas utama adalah menganalisis workspace Notion yang sudah tersedia dan membangun sistem produktivitas terpadu yang mengintegrasikan tiga komponen utama:

1. **To-Do List** — mengelola pekerjaan dan tugas yang harus diselesaikan.
2. **Sticky Notes** — menangkap ide, catatan singkat, pengingat, dan informasi sementara.
3. **Calendar** — mengelola jadwal kegiatan, agenda, tenggat waktu, dan peristiwa penting.

Sistem harus memungkinkan ketiga komponen bekerja secara terintegrasi, tetapi tetap mempertahankan fungsi dan karakteristik masing-masing.

Jangan langsung membuat database baru sebelum memahami struktur database yang sudah tersedia.

## 2. Database Existing yang Harus Dianalisis

Gunakan database berikut sebagai sumber data utama.

### A. Daily Task Management — Task Board

Database ini digunakan untuk mengelola pekerjaan yang membutuhkan proses, prioritas, dan pemantauan penyelesaian.

Properti yang tersedia:

- Name
- Progress
- Finish at
- Activity
- Status KipApp
- Note

Pilihan Progress:
- Very Urgent
- Not Started
- Doing
- Waiting on External
- Done

Pilihan Activity mencakup:
Administrasi, Dasar, DLS, Humas, Latsar, Podes, Polkam, Sakernas, Sektoral, Seruti Tw 2 & Tw 4, Sensus Ekonomi, SNLIK, Supas, Susenas-Seruti, Tambahan, ZI, dan DTSEN.

Status KipApp:
- Pending
- Not Add
- Added

### B. Sticky Notes — Task

Database ini digunakan untuk menangkap tugas sederhana, ide, dan catatan yang belum tentu membutuhkan pengelolaan pekerjaan secara formal.

Properti yang tersedia:

- Task
- Date
- Status
- Area
- Notes
- Completed?
- Priority

Area:
- Personal
- Family
- Business
- Side Hustle

Priority:
- Low
- Medium
- High

Status:
- Not started
- In progress
- Done

### C. Event And Calendar

Database ini digunakan untuk menyimpan agenda dan kegiatan yang memiliki tanggal atau rentang tanggal.

Properti yang tersedia:

- Content name
- Date
- Activity
- Status

Activity mencakup kegiatan pekerjaan seperti Sakernas, Susenas, Seruti, Sensus Ekonomi, Administrasi, Humas, dan kategori lainnya. Terdapat pula:
- Libur Nasional
- Cuti Bersama

### D. Notes🤓

Database ini digunakan untuk menyimpan catatan yang lebih panjang, dokumentasi, pemikiran, dan informasi yang perlu dipertahankan.

Analisis database ini untuk menentukan bagaimana catatan panjang dapat dihubungkan dengan tugas maupun Sticky Notes.

## 3. Prinsip Arsitektur Integrasi

Rancang sistem dengan prinsip berikut:

### A. Single Source of Truth

Hindari menyimpan data yang sama berulang kali di beberapa database.

Setiap entitas harus memiliki sumber data utama. Database lain cukup menampilkan informasi melalui Relation, Rollup, atau Linked Database View.

Jangan membuat salinan tugas hanya agar dapat ditampilkan di kalender.

### B. Hubungan Antar-Komponen

Rancang hubungan logis berikut:

- To-Do List dapat memiliki tanggal penyelesaian dan ditampilkan pada Calendar.
- Sticky Notes dapat dikonversi menjadi To-Do List.
- Sticky Notes yang memiliki tanggal dapat ditampilkan sebagai pengingat pada Calendar.
- Event Calendar dapat memiliki daftar pekerjaan atau tugas yang terkait.
- Notes🤓 dapat dihubungkan dengan To-Do List, Sticky Notes, maupun Event Calendar.

Gunakan Relation dan Rollup jika sesuai dengan kemampuan Notion.

### C. Pembedaan Jenis Informasi

Jangan menyamakan semua data.

Bedakan:
- Task: pekerjaan yang memerlukan tindakan dan penyelesaian.
- Sticky Note: informasi sementara, ide, pengingat, atau catatan cepat.
- Event: kegiatan atau agenda yang berlangsung pada waktu tertentu.
- Long-form Note: dokumentasi atau catatan yang membutuhkan uraian lebih panjang.

## 4. Workflow yang Harus Didukung

### Workflow 1 — Quick Capture

Pengguna dapat memasukkan ide atau pekerjaan secara cepat melalui Sticky Notes.

Sistem harus memungkinkan pengguna menyimpan:
- Judul.
- Isi catatan.
- Area atau kategori.
- Prioritas jika relevan.
- Tanggal jika ada.

Jangan mewajibkan seluruh properti terisi saat membuat catatan.

### Workflow 2 — Convert Sticky Note to Task

Sediakan mekanisme untuk mengubah Sticky Note menjadi To-Do List.

Saat konversi:
- Judul menjadi nama tugas.
- Isi catatan menjadi Note atau informasi pendukung.
- Area dan kategori dipetakan secara logis.
- Tanggal dan prioritas dipertahankan jika tersedia.
- Status awal tugas menjadi Not Started.
- Sticky Note asal tetap tersimpan dan dihubungkan dengan tugas hasil konversi.

Pastikan tidak terjadi duplikasi apabila proses konversi dilakukan lebih dari satu kali.

### Workflow 3 — Task Scheduling

Ketika suatu tugas memiliki tanggal penyelesaian, tugas tersebut dapat muncul dalam tampilan kalender.

Informasi yang ditampilkan minimal:
- Nama tugas.
- Tanggal penyelesaian.
- Prioritas.
- Status.
- Kategori aktivitas.

Perubahan tanggal atau status tugas harus tercermin pada tampilan kalender tanpa membuat entri duplikat.

### Workflow 4 — Event to Task

Pengguna dapat membuat tugas yang berkaitan dengan suatu kegiatan.

Contoh:
- Event: Pelatihan Petugas Sakernas.
- Tasks: Menyiapkan materi, mencetak daftar hadir, menyiapkan perlengkapan, dan membuat dokumentasi.

Hubungan antara event dan seluruh tugas pendukung harus dapat dilihat dengan mudah.

### Workflow 5 — Daily Planning

Sediakan tampilan untuk membantu pengguna merencanakan aktivitas harian.

Tampilan harus menggabungkan:
- Agenda hari ini.
- Tugas yang harus diselesaikan hari ini.
- Tugas yang terlambat.
- Sticky Notes yang memiliki pengingat hari ini.
- Kegiatan yang sedang berlangsung.

Tugas tanpa tanggal tetap harus dapat ditemukan melalui tampilan Inbox atau daftar tugas tanpa jadwal.

## 5. Dashboard yang Harus Dirancang

Bangun dashboard utama dengan beberapa bagian:

### A. Today

Menampilkan:
- Agenda hari ini.
- Tugas yang jatuh tempo hari ini.
- Tugas prioritas tinggi.
- Pengingat Sticky Notes.
- Kegiatan yang sedang berlangsung.

### B. Upcoming

Menampilkan agenda dan tugas mendatang berdasarkan urutan tanggal.

### C. Task Management

Sediakan beberapa tampilan:
- Board berdasarkan Progress.
- Table seluruh tugas.
- Calendar berdasarkan Finish at.
- Tugas berdasarkan Activity.
- Tugas berdasarkan Priority.
- Overdue Tasks.

### D. Sticky Notes

Sediakan tampilan:
- Inbox / Unprocessed Notes.
- Notes berdasarkan Area.
- Notes berdasarkan Priority.
- Notes yang sudah dikonversi menjadi Task.
- Archived Notes.

### E. Calendar

Sediakan tampilan:
- Calendar bulanan.
- Agenda mingguan.
- Agenda harian.
- Kalender seluruh kegiatan.
- Filter berdasarkan Activity.
- Filter berdasarkan jenis kegiatan.

Pastikan Libur Nasional dan Cuti Bersama tetap dapat ditampilkan.

## 6. Aturan Otomasi dan Konsistensi Data

Implementasikan aturan berikut:

1. Tugas yang selesai harus memiliki status Done.
2. Perubahan tanggal tugas harus tercermin dalam tampilan kalender.
3. Tugas tanpa tanggal tidak boleh otomatis diberi tanggal.
4. Sticky Note yang dikonversi harus memiliki referensi ke tugas hasil konversi.
5. Konversi berulang tidak boleh menghasilkan duplikasi tugas.
6. Penghapusan atau pengarsipan Sticky Note tidak boleh otomatis menghapus Task yang sudah dibuat.
7. Perubahan status Task tidak boleh mengubah status Event secara otomatis tanpa aturan yang jelas.
8. Jangan mengubah atau menghapus data historis yang sudah ada.
9. Jangan mengubah kategori Activity yang sudah digunakan tanpa alasan dan persetujuan.
10. Pertahankan informasi Status KipApp karena merupakan bagian dari alur kerja yang sudah berjalan.

## 7. Tahapan Implementasi

Lakukan pekerjaan dalam tahapan berikut.

### Tahap 1 — Audit Workspace

- Identifikasi seluruh database yang relevan.
- Baca skema dan properti masing-masing database.
- Identifikasi hubungan yang sudah ada.
- Identifikasi duplikasi dan potensi konflik data.
- Pelajari tampilan dashboard yang sudah tersedia.
- Buat diagram hubungan antardatabase.

Jangan mengasumsikan nama properti atau ID database. Gunakan informasi aktual dari workspace.

### Tahap 2 — Rancang Arsitektur

Buat rancangan yang menjelaskan:
- Database mana yang tetap dipertahankan.
- Database mana yang perlu dikembangkan.
- Relation yang perlu ditambahkan.
- Rollup yang diperlukan.
- Linked Database View yang dibutuhkan.
- Alur perpindahan data antar-komponen.

Berikan alasan untuk setiap perubahan.

### Tahap 3 — Implementasi

Implementasikan rancangan secara bertahap.

Prioritaskan:
1. Integrasi Task dengan Calendar.
2. Integrasi Sticky Notes dengan Task.
3. Integrasi Event dengan Task.
4. Integrasi Notes🤓.
5. Pembuatan dashboard utama.

Jangan melakukan perubahan destruktif.

### Tahap 4 — Pengujian

Uji skenario berikut:

- Membuat Task baru.
- Memberi tanggal pada Task.
- Mengubah tanggal Task.
- Menyelesaikan Task.
- Membuat Sticky Note.
- Mengonversi Sticky Note menjadi Task.
- Mengonversi Sticky Note yang sama untuk kedua kalinya.
- Membuat Event dan menghubungkan beberapa Task.
- Menampilkan seluruh informasi pada dashboard.
- Memastikan data lama tetap utuh.

### Tahap 5 — Dokumentasi

Buat dokumentasi yang menjelaskan:
- Arsitektur sistem akhir.
- Fungsi masing-masing database.
- Hubungan antar-database.
- Workflow penggunaan.
- Aturan otomasi.
- Cara menggunakan dashboard.
- Batasan teknis yang masih ada.

## 8. Batasan dan Ketentuan Penting

- Jangan menghapus database lama.
- Jangan menghapus atau mengubah data historis.
- Jangan membuat database baru jika database lama masih dapat digunakan.
- Jangan membuat duplikasi data hanya untuk kebutuhan visualisasi.
- Jangan mengubah kategori dan status yang sudah ada secara sembarangan.
- Jangan mengasumsikan Notion mendukung otomasi yang tidak tersedia.
- Gunakan fitur native Notion terlebih dahulu.
- Jika memerlukan Notion API, webhook, atau layanan eksternal, jelaskan kebutuhan dan konsekuensinya.
- Jika suatu perubahan berisiko memengaruhi data lama, minta persetujuan sebelum menjalankannya.

## 9. Output yang Diharapkan

Hasil akhir harus berupa:

1. Sistem To-Do List, Sticky Notes, dan Calendar yang terintegrasi.
2. Dashboard utama untuk aktivitas harian.
3. Relasi antardatabase yang konsisten.
4. Workflow konversi Sticky Notes menjadi Task.
5. Tampilan kalender yang dapat menampilkan Event dan Task tanpa duplikasi.
6. Sistem pengelolaan tugas yang tetap mempertahankan kategori dan status pekerjaan yang sudah ada.
7. Dokumentasi arsitektur dan panduan penggunaan.

**Instruksi terakhir:** Mulai dengan audit dan analisis workspace. Jangan langsung mengimplementasikan seluruh perubahan. Tampilkan terlebih dahulu rancangan arsitektur dan daftar perubahan yang akan dilakukan, kemudian implementasikan secara bertahap setelah rancangan disetujui.