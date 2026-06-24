# Kalananti Presentation Timer

Sistem sinkronisasi timer presentasi tanpa backend yang menggunakan protokol MQTT via WebSockets. Sistem ini terdiri dari 2 bagian:

1. **Juri Dashboard**: Halaman web kontroler untuk Time Keeper (Juri).
2. **Peserta Extension**: Ekstensi Chrome yang menampilkan timer mengambang (overlay) secara *real-time* di tab presentasi siswa.

---

## 1. Juri Dashboard (Time Keeper)

### Cara Menggunakan:
1. Masuk ke folder `juri-dashboard`.
2. Klik 2x file `index.html` untuk membukanya di browser apa saja.
3. Anda akan melihat tulisan **Connected** warna hijau di pojok kanan atas, artinya sistem siap digunakan.

### Fitur:
- **Input Durasi**: Anda dapat mengubah angka durasi dalam satuan **menit** sebelum menekan tombol Mulai. Secara bawaan (default) di-set ke 3 menit.
- **Timer Presentasi**:
  - Tombol **Mulai**: Akan memulai hitungan mundur dan secara otomatis **menampilkan timer di layar siswa**.
  - Tombol **Jeda**: Menghentikan waktu sementara di kedua layar (Juri dan Siswa).
  - Tombol **Reset**: Mengembalikan waktu ke awal dan menyembunyikan timer dari layar siswa.
  - Saat waktu habis, layar siswa akan memunculkan layar merah penuh bertuliskan **"WAKTU HABIS!"**.
- **Timer Q&A**:
  - Saat tombol ini dimulai, sistem akan secara otomatis mematikan/menyembunyikan timer Presentasi di layar siswa.
  - Timer Q&A ini murni **hanya berjalan di layar Juri**, jadi layar siswa akan bersih tanpa gangguan timer.

---

## 2. Peserta Extension (Siswa)

### Mengapa butuh Chrome Extension?
Agar timer dapat "menempel" dan melayang di atas *web project* buatan siswa (seperti `kidscoding.ca` atau Google Slides), kita memerlukan Chrome Extension yang kebal terhadap *Content Security Policy* (CSP) dari website tersebut. 

### Cara Meng-install (Satu Kali Saja di Laptop Peserta):
1. Buka browser **Google Chrome** di laptop yang akan dipakai presentasi.
2. Di *address bar* (kolom URL), ketik `chrome://extensions/` lalu tekan Enter.
3. Di pojok kanan atas layar, pastikan tombol (toggle) **Developer mode** menyala (warna biru).
4. Klik tombol **Load unpacked** yang ada di kiri atas.
5. Cari dan pilih folder `peserta-extension` (berada di dalam folder `presentation-timer`).
6. Ekstensi bernama **"Kalananti Presentation Timer"** akan muncul.

### PENTING: Untuk Presentasi File Lokal (file:///)
Jika siswa membuka project presentasi mereka tidak melalui internet, melainkan dari file lokal yang ada di laptop mereka (alamat URL-nya dimulai dengan `file:///...`), maka Anda **wajib** menyalakan opsi ini:
1. Di halaman `chrome://extensions/`, klik tombol **Details** pada ekstensi Kalananti Presentation Timer.
2. *Scroll* sedikit ke bawah.
3. Aktifkan tombol **"Allow access to file URLs"**.

### Skenario Saat Lomba Berjalan:
- Siswa bebas membuka *tab* baru, berpindah antar halaman web, ataupun membuka file project lokal mereka.
- Selama Juri menekan tombol "Mulai Presentasi", **timer akan terus otomatis mengikuti layar aktif siswa**.
- Saat Juri mereset atau memulai Q&A, layar siswa akan otomatis bersih.
