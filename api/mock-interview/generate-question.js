import { generateInterviewQuestion } from '../../server/mockInterviewer.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const result = await generateInterviewQuestion(req.body || {});
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error('[API generate-question] error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate question.' });
  }
}

export const config = {
  maxDuration: 60,
};
