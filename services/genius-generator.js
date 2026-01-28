const { callGemini } = require('./gemini');

/**
 * 두 노트를 융합하여 아이디어 생성
 * @param {Object} noteA - { title, summary }
 * @param {Object} noteB - { title, summary }
 * @param {number} distanceScore - 이질성 점수
 * @returns {Promise<Object>} 생성된 아이디어
 */
async function generateIdea(noteA, noteB, distanceScore) {
  const prompt = buildPrompt(noteA, noteB, distanceScore);

  console.log('[Genius] Gemini 호출 중...');
  const response = await callGemini(prompt);

  return parseResponse(response);
}

function buildPrompt(noteA, noteB, distanceScore) {
  return `### Persona: Accidental Genius Generator
당신은 서로 다른 지식을 결합해 세상에 없던 비즈니스를 만드는 '아이디어 연금술사'입니다.
반드시 한국어로 답변하세요.

### Input Data
- Note A: [${noteA.title}]
${noteA.summary.slice(0, 800)}

- Note B: [${noteB.title}]
${noteB.summary.slice(0, 800)}

- Distance Score: ${distanceScore}/100 (높을수록 이질적인 조합)

### Task: "Creative Cross-Pollination"
1. **숨겨진 공통점**: 겉보기에 전혀 다른 두 개념의 숨겨진 공통 원리를 찾으세요
2. **비즈니스 아이디어**: 두 지식을 융합한 수익 모델 또는 생산성 도구 아이디어
3. **파급 효과**: 이 아이디어가 실현되면 어떤 변화가 생길까요?
4. **씨앗 문장**: 당장 메모해둘 만한 한 문장

### Output Format (반드시 이 JSON 형식으로)
\`\`\`json
{
  "commonPrinciple": "두 개념의 숨겨진 공통점",
  "businessIdea": {
    "name": "아이디어 이름",
    "description": "상세 설명",
    "targetUser": "대상 사용자"
  },
  "impact": "파급 효과",
  "seedSentence": "씨앗 문장"
}
\`\`\``;
}

function parseResponse(response) {
  // JSON 블록 추출
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error('[Genius] JSON 파싱 실패:', e.message);
    }
  }

  // JSON 블록 없으면 전체 파싱 시도
  try {
    return JSON.parse(response);
  } catch (e) {
    // 파싱 실패 시 기본 구조 반환
    return {
      commonPrinciple: '파싱 실패',
      businessIdea: { name: '파싱 실패', description: response, targetUser: '' },
      impact: '',
      seedSentence: ''
    };
  }
}

module.exports = { generateIdea };
