const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const CACHE_PATH = path.join(__dirname, '../data/trends.json');

/**
 * Reddit에서 트렌드 포스트 가져오기
 */
async function fetchTrends() {
  // 캐시 확인
  if (isCacheValid()) {
    console.log('[Reddit] 캐시 사용');
    return loadCache();
  }

  console.log('[Reddit] 트렌드 수집 중...');
  const allPosts = [];

  for (const subreddit of config.subreddits) {
    try {
      const posts = await fetchSubreddit(subreddit);
      allPosts.push(...posts);
      // Rate limit 방지
      await sleep(100);
    } catch (err) {
      console.error(`[Reddit] r/${subreddit} 실패:`, err.message);
    }
  }

  // 중복 제거 및 정렬
  const uniquePosts = deduplicatePosts(allPosts);
  const sortedPosts = uniquePosts.sort((a, b) => b.score - a.score);

  // 캐시 저장
  const result = {
    posts: sortedPosts.slice(0, 100), // 상위 100개
    fetchedAt: new Date().toISOString()
  };

  saveCache(result);
  console.log(`[Reddit] ${result.posts.length}개 포스트 수집 완료`);

  return result;
}

/**
 * 단일 서브레딧에서 hot 포스트 가져오기
 */
function fetchSubreddit(subreddit) {
  return new Promise((resolve, reject) => {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`;

    const options = {
      headers: {
        'User-Agent': 'trend-connector/1.0.0'
      }
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const posts = json.data.children.map(child => ({
            subreddit: subreddit,
            title: child.data.title,
            score: child.data.score,
            url: `https://reddit.com${child.data.permalink}`,
            keywords: extractKeywordsFromTitle(child.data.title)
          }));
          resolve(posts);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

/**
 * 제목에서 키워드 추출
 */
function extractKeywordsFromTitle(title) {
  const keywords = [];
  const words = title.toLowerCase()
    .replace(/[^a-zA-Z가-힣0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // config의 키워드 매핑과 대조
  for (const [korean, englishList] of Object.entries(config.keywordMapping)) {
    for (const word of words) {
      if (word === korean.toLowerCase() || englishList.some(en => en.toLowerCase() === word)) {
        keywords.push(korean.toLowerCase());
        break;
      }
    }
  }

  // 매핑에 없는 주요 단어도 추가
  words.forEach(word => {
    if (word.length > 3 && !keywords.includes(word)) {
      keywords.push(word);
    }
  });

  return [...new Set(keywords)];
}

/**
 * 중복 포스트 제거
 */
function deduplicatePosts(posts) {
  const seen = new Set();
  return posts.filter(post => {
    if (seen.has(post.url)) return false;
    seen.add(post.url);
    return true;
  });
}

/**
 * 캐시 유효성 확인
 */
function isCacheValid() {
  if (!fs.existsSync(CACHE_PATH)) return false;

  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    const fetchedAt = new Date(cache.fetchedAt).getTime();
    const now = Date.now();
    return (now - fetchedAt) < config.cacheExpiry;
  } catch {
    return false;
  }
}

function loadCache() {
  return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
}

function saveCache(data) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { fetchTrends };
