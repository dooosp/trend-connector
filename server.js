const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { indexVault } = require('./services/obsidian-indexer');
const { pickDistantNotes } = require('./services/note-picker');
const { generateIdea } = require('./services/genius-generator');

const app = express();

const IDEAS_PATH = path.join(__dirname, 'data/ideas.json');
const HISTORY_DIR = path.join(__dirname, 'data/history');
const USAGE_PATH = path.join(__dirname, 'data/usage.json');

// 폴더 생성
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static('public'));

/**
 * 메인 API: 아이디어 생성
 */
app.get('/api/generate', async (req, res) => {
  try {
    // 일일 제한 체크
    if (isLimitReached()) {
      return res.status(429).json({
        success: false,
        error: `일일 제한 도달 (${config.dailyLimit}회)`
      });
    }

    // 이질적인 노트 쌍 선택
    const { noteA, noteB, distanceScore } = await pickDistantNotes();

    // Gemini로 아이디어 생성
    const result = await generateIdea(noteA, noteB, distanceScore);

    // 아이디어 저장
    const idea = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      noteA: { path: noteA.path, title: noteA.title, summary: noteA.summary.slice(0, 500) },
      noteB: { path: noteB.path, title: noteB.title, summary: noteB.summary.slice(0, 500) },
      distanceScore,
      result,
      saved: false
    };

    saveIdea(idea);
    incrementUsage();

    res.json({ success: true, idea });
  } catch (err) {
    console.error('[API] /api/generate 에러:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 히스토리 목록
 */
app.get('/api/history', (req, res) => {
  try {
    const ideas = loadIdeas();
    const history = ideas.map(i => ({
      id: i.id,
      createdAt: i.createdAt,
      noteA: i.noteA.title,
      noteB: i.noteB.title,
      ideaName: i.result?.businessIdea?.name || '무제',
      distanceScore: i.distanceScore,
      saved: i.saved
    })).reverse();

    res.json({ success: true, history, todayUsage: getTodayUsage() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 특정 아이디어 상세
 */
app.get('/api/history/:id', (req, res) => {
  try {
    const ideas = loadIdeas();
    const idea = ideas.find(i => i.id === req.params.id);

    if (!idea) {
      return res.status(404).json({ success: false, error: '아이디어 없음' });
    }

    res.json({ success: true, idea });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 아이디어 즐겨찾기 토글
 */
app.post('/api/save/:id', (req, res) => {
  try {
    const ideas = loadIdeas();
    const idea = ideas.find(i => i.id === req.params.id);

    if (!idea) {
      return res.status(404).json({ success: false, error: '아이디어 없음' });
    }

    idea.saved = !idea.saved;
    saveIdeas(ideas);

    res.json({ success: true, saved: idea.saved });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 옵시디언 재인덱싱
 */
app.post('/api/reindex', async (req, res) => {
  try {
    await indexVault();
    res.json({ success: true, message: '인덱싱 완료' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 노트 원문 미리보기
 */
app.get('/api/preview', (req, res) => {
  try {
    const filePath = req.query.file;
    const fullPath = path.join(config.vaultPath, filePath);

    if (process.env.NODE_ENV === 'production') {
      return res.json({
        success: true,
        preview: `[클라우드 환경]\n\n파일: ${filePath}\n\n원본은 로컬에서만 확인 가능합니다.`,
        isCloud: true
      });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: '파일 없음' });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ success: true, preview: content });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 사용량 정보
 */
app.get('/api/usage', (req, res) => {
  res.json({
    success: true,
    todayUsage: getTodayUsage(),
    dailyLimit: config.dailyLimit
  });
});

// Helper functions
function loadIdeas() {
  if (!fs.existsSync(IDEAS_PATH)) return [];
  return JSON.parse(fs.readFileSync(IDEAS_PATH, 'utf-8'));
}

function saveIdeas(ideas) {
  fs.writeFileSync(IDEAS_PATH, JSON.stringify(ideas, null, 2), 'utf-8');
}

function saveIdea(idea) {
  const ideas = loadIdeas();
  ideas.push(idea);
  saveIdeas(ideas);
}

function loadUsage() {
  if (!fs.existsSync(USAGE_PATH)) return {};
  return JSON.parse(fs.readFileSync(USAGE_PATH, 'utf-8'));
}

function saveUsage(usage) {
  fs.writeFileSync(USAGE_PATH, JSON.stringify(usage, null, 2), 'utf-8');
}

function getTodayUsage() {
  const today = new Date().toISOString().split('T')[0];
  const usage = loadUsage();
  return usage[today] || 0;
}

function incrementUsage() {
  const today = new Date().toISOString().split('T')[0];
  const usage = loadUsage();
  usage[today] = (usage[today] || 0) + 1;
  saveUsage(usage);
}

function isLimitReached() {
  return getTodayUsage() >= config.dailyLimit;
}

function generateId() {
  return 'idea_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 서버 시작
const PORT = process.env.PORT || config.port;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║    🧠 Accidental Genius Generator 실행중   ║
  ║                                           ║
  ║       http://localhost:${PORT}                ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `);
});
