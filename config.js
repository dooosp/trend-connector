module.exports = {
  // Obsidian Vault 경로
  vaultPath: process.env.VAULT_PATH || '/mnt/c/Users/wkdxo/OneDrive/문서/Obsidian Vault',

  // 서버 포트
  port: process.env.PORT || 3000,

  // Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: 'gemini-2.0-flash',

  // 노트 선택 설정
  minNoteLength: 500,        // 최소 노트 길이 (자)
  minDistanceScore: 60,      // 최소 이질성 점수
  maxRetries: 5,             // 이질적 쌍 찾기 최대 시도
  summaryLength: 1000,       // 노트 요약 길이

  // 일일 제한
  dailyLimit: 10,

  // 캐시 유효 시간 (밀리초)
  cacheExpiry: 60 * 60 * 1000, // 1시간

  // 한글-영어 키워드 매핑 (재사용)
  keywordMapping: {
    '정체성': ['identity', 'self', 'who am i', 'sense of self'],
    '공감': ['empathy', 'understanding', 'compassion', 'emotional intelligence'],
    '성찰': ['reflection', 'introspection', 'self-awareness', 'contemplation'],
    '번아웃': ['burnout', 'exhaustion', 'overwhelmed', 'stressed'],
    '성장': ['growth', 'development', 'improvement', 'progress'],
    '질문': ['question', 'curiosity', 'inquiry', 'wonder'],
    '과정': ['process', 'journey', 'path', 'progress'],
    '의미': ['meaning', 'purpose', 'significance', 'fulfillment'],
    '행복': ['happiness', 'joy', 'wellbeing', 'contentment'],
    '관계': ['relationship', 'connection', 'bond', 'social'],
    '선택': ['choice', 'decision', 'free will', 'autonomy'],
    '변화': ['change', 'transformation', 'evolution', 'transition'],
    '가치': ['value', 'principle', 'belief', 'worth'],
    '자유': ['freedom', 'liberty', 'independence', 'autonomy'],
    '책임': ['responsibility', 'accountability', 'duty', 'obligation'],
    'AI': ['AI', 'artificial intelligence', 'machine learning', 'GPT', 'LLM'],
    '영화': ['movie', 'film', 'cinema', 'director'],
    '도서': ['book', 'reading', 'literature', 'novel'],
    '글쓰기': ['writing', 'journaling', 'essay', 'blogging'],
    '노동': ['work', 'labor', 'job', 'career', 'employment'],
    '기술': ['technology', 'tech', 'engineering', 'innovation'],
    '창의성': ['creativity', 'creative', 'imagination', 'innovation']
  }
};
