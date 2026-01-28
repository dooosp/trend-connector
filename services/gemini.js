const https = require('https');
const config = require('../config');

/**
 * Gemini API 호출
 * @param {string} prompt - 프롬프트
 * @returns {Promise<string>} 응답 텍스트
 */
async function callGemini(prompt) {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.9,
      maxOutputTokens: 2048
    }
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) {
            reject(new Error(json.error.message));
            return;
          }
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = { callGemini };
