PANDUAN INSTALASI & PENGGUNAAN APLIKASI ANTIHOAX
================================================

Aplikasi ini menggunakan 2 sistem: Frontend (React.js) dan Backend (Python FastAPI).
Silakan ikuti langkah-langkah di bawah ini secara berurutan.

--- 1. PERSIAPAN SOFTWARE AWAL ---
Pastikan di komputer/laptop Anda sudah terinstal:
1. Git
2. Node.js (versi 18 ke atas)
3. Python (versi 3.10 ke atas)
4. Code Editor (disarankan menggunakan Visual Studio Code / VS Code)


--- 2. CARA DOWNLOAD DARI GITHUB ---
1. Buka folder di komputer Anda di mana Anda ingin menyimpan aplikasi ini.
2. Klik kanan di dalam folder tersebut, pilih "Open in Terminal" atau "Git Bash Here".
3. Ketik perintah berikut lalu tekan Enter:
   git clone https://github.com/Brxcc/IndoBERT-UMAP-and-GNN-GAT-.-HOAX-DETECTION-APP.git

4. Buka aplikasi Visual Studio Code (VS Code).
5. Klik menu "File" -> "Open Folder", lalu pilih folder "IndoBERT-UMAP-and-GNN-GAT-.-HOAX-DETECTION-APP" yang baru saja di-download.


--- 3. CARA MENJALANKAN BACKEND (PYTHON API) ---
1. Di dalam VS Code, buka terminal baru (klik menu "Terminal" -> "New Terminal").
2. Ketik perintah ini untuk masuk ke folder backend:
   cd backend

3. Buat virtual environment (agar library Python tidak bentrok dengan aplikasi lain):
   python -m venv venv

4. Aktifkan virtual environment:
   - Jika Anda pakai Windows: venv\Scripts\activate
   - Jika Anda pakai Mac/Linux: source venv/bin/activate
   (Tanda berhasil: akan muncul tulisan "(venv)" di bagian kiri terminal Anda)

5. Instal semua library Machine Learning & API yang dibutuhkan:
   pip install -r requirements.txt

6. Jalankan server backend:
   python run.py

>>> PENTING: Biarkan terminal ini tetap menyala. Jangan ditutup!


--- 4. CARA MENJALANKAN FRONTEND (TAMPILAN WEB) ---
1. Di VS Code, buka tab terminal BARU (tekan ikon "+" di panel terminal agar terminal backend yang tadi tidak tertutup).
2. Di terminal baru tersebut, masuk ke folder frontend dengan mengetik:
   cd frontend

3. Instal library untuk frontend (tunggu sampai proses download selesai):
   npm install

4. Jalankan tampilan frontend-nya:
   npm run dev


--- 5. BUKA APLIKASI ---
Jika kedua terminal (backend & frontend) berjalan lancar tanpa error:
1. Buka browser Anda (Google Chrome / Microsoft Edge).
2. Ketikkan atau kunjungi alamat lokal ini:
   http://localhost:5173

Selamat! Aplikasi AntiHoax sudah berhasil dijalankan dan siap digunakan.
