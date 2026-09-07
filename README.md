# TP Score

Aplikasi penilaian siswa berbasis TP dengan pemindai lembar jawaban menggunakan OpenAI Vision.

## Menjalankan lokal

1. Salin `.env.example` menjadi `.env.local` dan isi `OPENAI_API_KEY`.
2. Jalankan `npm install`.
3. Untuk aplikasi lengkap termasuk fungsi pemindai, jalankan `npx vercel dev`. `npm run dev` hanya menjalankan antarmuka Vite.

## Deploy ke Vercel

Impor folder ini ke Vercel dan tambahkan Environment Variable `OPENAI_API_KEY`. Opsional: atur `OPENAI_VISION_MODEL`.

Data aplikasi tersimpan di browser perangkat. API key hanya digunakan oleh fungsi server `/api/scan` dan tidak dikirim ke aplikasi klien.
