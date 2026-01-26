const fs = require('fs');
const path = require('path');
const config = require('../config');

const KEYWORDS_PATH = path.join(__dirname, '../data/keywords.json');

/**
 * Reddit 포스트와 Obsidian 글 매칭
 */
function matchTrendsWithNotes(trends) {
  const keywords = loadKeywords();
  const matches = [];

  for (const post of trends.posts) {
    const linkedFiles = findLinkedFiles(post, keywords);

    if (linkedFiles.length > 0) {
      matches.push({
        id: generateId(),
        subreddit: post.subreddit,
        title: post.title,
        url: post.url,
        score: post.score,
        linkedFiles: linkedFiles,
        matchedKeywords: post.keywords.filter(k => keywords[k]),
        reflection: generateReflectionQuestion(post, linkedFiles)
      });
    }
  }

  // 연결된 파일 수로 정렬
  return matches.sort((a, b) => b.linkedFiles.length - a.linkedFiles.length);
}

/**
 * 포스트와 연결된 파일 찾기
 */
function findLinkedFiles(post, keywords) {
  const linkedFiles = new Set();

  for (const keyword of post.keywords) {
    // 직접 매칭
    if (keywords[keyword]) {
      keywords[keyword].forEach(file => linkedFiles.add(file));
    }

    // 한글-영어 교차 매칭
    for (const [korean, englishList] of Object.entries(config.keywordMapping)) {
      if (keyword === korean.toLowerCase() || englishList.some(en => en.toLowerCase() === keyword)) {
        if (keywords[korean.toLowerCase()]) {
          keywords[korean.toLowerCase()].forEach(file => linkedFiles.add(file));
        }
        for (const en of englishList) {
          if (keywords[en.toLowerCase()]) {
            keywords[en.toLowerCase()].forEach(file => linkedFiles.add(file));
          }
        }
      }
    }
  }

  return Array.from(linkedFiles).slice(0, 5); // 최대 5개
}

/**
 * 성찰 질문 생성
 */
function generateReflectionQuestion(post, linkedFiles) {
  const templates = [
    `r/${post.subreddit}에서 "${truncate(post.title, 30)}"가 화제입니다. 당신의 글과 어떤 연결이 느껴지나요?`,
    `이 주제에 대해 글을 쓸 때와 지금, 생각이 바뀌었나요?`,
    `전 세계가 이 주제를 논의하고 있습니다. 당신만의 관점은 무엇인가요?`,
    `과거의 당신이 지금 이 트렌드를 본다면 어떤 말을 할까요?`
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * 키워드 인덱스 로드
 */
function loadKeywords() {
  if (!fs.existsSync(KEYWORDS_PATH)) {
    console.warn('[Matcher] keywords.json 없음. npm run index 실행 필요');
    return {};
  }
  return JSON.parse(fs.readFileSync(KEYWORDS_PATH, 'utf-8'));
}

function generateId() {
  return 'conn_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function truncate(str, len) {
  return str.length > len ? str.substring(0, len) + '...' : str;
}

module.exports = { matchTrendsWithNotes };
