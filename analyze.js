export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { imageBase64 } = req.body;
  if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 }
          },
          {
            type: 'text',
            text: `You are a sharp, honest, stylish fashion critic. Analyse this outfit photo and respond ONLY with valid JSON, no markdown, no extra text.

Return exactly this structure:
{
  "overallScore": <number 1-10>,
  "verdict": "<one punchy sentence verdict, max 12 words>",
  "scores": {
    "Cohesion": <1-10>,
    "Fit": <1-10>,
    "Colour": <1-10>,
    "Creativity": <1-10>,
    "Vibe": <1-10>
  },
  "whatWorks": "<2-3 sentences on what's working>",
  "whatDoesnt": "<2-3 sentences on what's not working>",
  "stylistTip": "<one specific, actionable tip to elevate the look>"
}`
          }
        ]
      }]
    })
  });

  const data = await response.json();
  const text = data.content.map(i => i.text || '').join('');
  const clean = text.replace(/```json|```/g, '').trim();

  try {
    const result = JSON.parse(clean);
    res.status(200).json(result);
  } catch {
    res.status(500).json({ error: 'Failed to parse response' });
  }
}
