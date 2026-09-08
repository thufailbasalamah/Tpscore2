import OpenAI from 'openai';

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } };

const answerSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    student_name: { type: 'string' },
    nisn: { type: 'string' },
    answers: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false,
        properties: {
          question_number: { type: 'integer' }, answer: { type: 'string' },
          confidence: { type: 'number' }, status: { type: 'string', enum: ['detected', 'uncertain', 'empty'] }
        },
        required: ['question_number', 'answer', 'confidence', 'status']
      }
    }
  },
  required: ['student_name', 'nisn', 'answers']
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metode tidak didukung.' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY belum dikonfigurasi di server.' });

  const { image, totalQuestions, options } = req.body || {};
  if (typeof image !== 'string' || !image.startsWith('data:image/')) return res.status(400).json({ error: 'Gambar tidak valid.' });
  if (image.length > 10_000_000) return res.status(413).json({ error: 'Ukuran gambar terlalu besar. Maksimal sekitar 7 MB.' });
  const total = Math.min(200, Math.max(1, Number(totalQuestions) || 20));
  const allowed = Array.isArray(options) && options.length ? options.map(String) : ['A', 'B', 'C', 'D'];

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini',
      input: [{ role: 'user', content: [
        { type: 'input_text', text: `Baca lembar jawaban pilihan ganda ini. Ada tepat ${total} soal dan opsi yang sah: ${allowed.join(', ')}. Untuk jawaban ganda, gabungkan dengan tanda +, misalnya A+B, dan beri status uncertain. Untuk kosong gunakan tanda - dan status empty. Jangan menebak jika tanda tidak jelas. Kembalikan semua nomor 1 sampai ${total} berurutan. Baca nama dan NISN jika terlihat, jika tidak isi string kosong.` },
        { type: 'input_image', image_url: image, detail: 'high' }
      ] }],
      text: { format: { type: 'json_schema', name: 'answer_sheet_scan', strict: true, schema: answerSchema } }
    });
    const parsed = JSON.parse(response.output_text);
    const byNumber: Record<string, any> = {};
    for (let q = 1; q <= total; q++) {
      const item = parsed.answers.find((x: any) => x.question_number === q) || { question_number: q, answer: '-', confidence: 0, status: 'empty' };
      const parts = String(item.answer).split('+').filter((x: string) => allowed.includes(x));
      byNumber[q] = { ...item, answer: parts.length ? [...new Set(parts)].join('+') : '-' };
    }
    return res.status(200).json({ student_name: parsed.student_name || '', nisn: parsed.nisn || '', answers: byNumber });
  } catch (error: any) {
    const status = error?.status && Number.isInteger(error.status) ? error.status : 500;
    return res.status(status).json({ error: error?.message || 'Pemindaian gagal diproses.' });
  }
}
