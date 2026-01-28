const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getAllMarkdownFiles } = require('./obsidian-indexer');
const { calculateDistance } = require('./distance-calculator');

const KEYWORDS_PATH = path.join(__dirname, '../data/keywords.json');

/**
 * 이질적인 노트 쌍 선택
 * @returns {Promise<{noteA, noteB, distanceScore}>}
 */
async function pickDistantNotes() {
  const notes = await getEligibleNotes();

  if (notes.length < 2) {
    throw new Error(`노트가 부족합니다 (현재: ${notes.length}개, 최소: 2개)`);
  }

  let bestPair = null;
  let bestDistance = 0;

  for (let i = 0; i < config.maxRetries; i++) {
    const noteA = pickRandom(notes);
    const candidates = notes.filter(n => n.path !== noteA.path);
    const noteB = pickRandom(candidates);

    const distance = calculateDistance(noteA, noteB);

    if (distance > bestDistance) {
      bestDistance = distance;
      bestPair = { noteA, noteB };
    }

    if (distance >= config.minDistanceScore) break;
  }

  console.log(`[NotePicker] 거리 점수: ${bestDistance}`);
  return { ...bestPair, distanceScore: bestDistance };
}

/**
 * 조건에 맞는 노트 목록 (500자 이상)
 */
async function getEligibleNotes() {
  const keywords = loadKeywords();
  const files = getAllMarkdownFiles(config.vaultPath);
  const eligible = [];

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.length < config.minNoteLength) continue;

      const relativePath = path.relative(config.vaultPath, filePath);
      const noteData = parseNote(relativePath, content, keywords);
      eligible.push(noteData);
    } catch (err) {
      // 파일 읽기 실패 무시
    }
  }

  console.log(`[NotePicker] ${eligible.length}개 노트 후보`);
  return eligible;
}

/**
 * 노트 파싱 (메타데이터 추출)
 */
function parseNote(relativePath, content, keywords) {
  const folder = path.dirname(relativePath);
  const title = path.basename(relativePath, '.md');

  // 해시태그 추출
  const tagRegex = /#([가-힣a-zA-Z0-9_]+)/g;
  const tags = [];
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }

  // 키워드 (인덱스에서 역추적)
  const noteKeywords = [];
  for (const [keyword, files] of Object.entries(keywords)) {
    if (files.includes(relativePath)) {
      noteKeywords.push(keyword);
    }
  }

  // 요약 (앞부분)
  const summary = content.slice(0, config.summaryLength).trim();

  return { path: relativePath, folder, title, tags, keywords: noteKeywords, summary };
}

function loadKeywords() {
  if (!fs.existsSync(KEYWORDS_PATH)) return {};
  return JSON.parse(fs.readFileSync(KEYWORDS_PATH, 'utf-8'));
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { pickDistantNotes, getEligibleNotes };
