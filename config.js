module.exports = {
  // Obsidian Vault 경로
  vaultPath: '/mnt/c/Users/wkdxo/OneDrive/문서/Obsidian Vault',

  // 서버 포트
  port: 3000,

  // Reddit 서브레딧 목록 (글로벌)
  subreddits: [
    // 철학/정체성
    'philosophy', 'existentialism', 'stoicism',
    // 자기계발
    'selfimprovement', 'getdisciplined', 'DecidingToBeBetter',
    // 심리
    'psychology', 'mentalhealth', 'mindfulness',
    // 사회/문화
    'sociology', 'TrueReddit', 'changemyview',
    // 기술/AI
    'technology', 'artificial', 'singularity',
    // 영화/도서
    'movies', 'TrueFilm', 'books', 'literature',
    // 글쓰기
    'writing', 'Journaling',
    // 커리어
    'careerguidance', 'cscareerquestions',
    // 한국
    'korea', 'hanguk'
  ],

  // 캐시 유효 시간 (밀리초)
  cacheExpiry: 60 * 60 * 1000, // 1시간

  // 한글-영어 키워드 매핑
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
    '노동': ['work', 'labor', 'job', 'career', 'employment']
  }
};
