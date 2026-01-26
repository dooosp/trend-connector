const express = require('express');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { indexVault } = require('./services/obsidian-indexer');
const { fetchTrends } = require('./services/reddit-fetcher');
const { matchTrendsWithNotes } = require('./services/matcher');

const app = express();
const CONNECTIONS_PATH = path.join(__dirname, 'data/connections.json');
const HISTORY_DIR = path.join(__dirname, 'data/history');
const SEEN_PATH = path.join(__dirname, 'data/seen.json');

// 히스토리 폴더 생성
if (!fs.existsSync(HISTORY_DIR)) {
  fs.mkdirSync(HISTORY_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static('public'));

/**
 * 메인 API: 트렌드 + 매칭 결과 + 히스토리 저장
 */
app.get('/api/trends', async (req, res) => {
  try {
    const trends = await fetchTrends();
    const matches = matchTrendsWithNotes(trends);
    const seen = loadSeen();

    // NEW 표시를 위해 이전에 본 트렌드 체크
    const matchesWithNew = matches.map(m => ({
      ...m,
      isNew: !seen[m.url]
    }));

    // 오늘 히스토리 저장
    saveHistory(matchesWithNew);

    // 본 트렌드 기록
    matches.forEach(m => seen[m.url] = new Date().toISOString());
    saveSeen(seen);

    res.json({
      success: true,
      fetchedAt: trends.fetchedAt,
      matchCount: matches.length,
      newCount: matchesWithNew.filter(m => m.isNew).length,
      matches: matchesWithNew
    });
  } catch (err) {
    console.error('[API] /api/trends 에러:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 히스토리 목록
 */
app.get('/api/history', (req, res) => {
  try {
    const files = fs.readdirSync(HISTORY_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    const history = files.map(f => {
      const date = f.replace('.json', '');
      const data = JSON.parse(fs.readFileSync(path.join(HISTORY_DIR, f), 'utf-8'));
      return {
        date,
        matchCount: data.matches?.length || 0,
        newCount: data.matches?.filter(m => m.isNew).length || 0
      };
    });

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 특정 날짜 히스토리
 */
app.get('/api/history/:date', (req, res) => {
  try {
    const filePath = path.join(HISTORY_DIR, `${req.params.date}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '히스토리 없음' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ success: true, ...data });
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
 * 연결 저장
 */
app.post('/api/connections', (req, res) => {
  try {
    const connection = {
      ...req.body,
      savedAt: new Date().toISOString()
    };

    const connections = loadConnections();
    connections.push(connection);
    saveConnections(connections);

    res.json({ success: true, connection });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 저장된 연결 목록
 */
app.get('/api/connections', (req, res) => {
  const connections = loadConnections();
  res.json({ success: true, connections });
});

/**
 * 글 내용 보기
 */
app.get('/api/preview', (req, res) => {
  try {
    const filePath = req.query.file;
    const fullPath = path.join(config.vaultPath, filePath);

    // 클라우드 환경 체크
    if (process.env.NODE_ENV === 'production') {
      return res.json({
        success: true,
        preview: `[클라우드 환경]\n\n파일: ${filePath}\n\n옵시디언 원본은 로컬에서만 확인 가능합니다.`,
        fullLength: 0,
        isCloud: true
      });
    }

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, error: '파일 없음' });
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    res.json({ success: true, preview: content, fullLength: content.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper functions
function loadConnections() {
  if (!fs.existsSync(CONNECTIONS_PATH)) return [];
  return JSON.parse(fs.readFileSync(CONNECTIONS_PATH, 'utf-8'));
}

function saveConnections(connections) {
  fs.writeFileSync(CONNECTIONS_PATH, JSON.stringify(connections, null, 2), 'utf-8');
}

function loadSeen() {
  if (!fs.existsSync(SEEN_PATH)) return {};
  return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
}

function saveSeen(seen) {
  fs.writeFileSync(SEEN_PATH, JSON.stringify(seen, null, 2), 'utf-8');
}

function saveHistory(matches) {
  const today = new Date().toISOString().split('T')[0];
  const filePath = path.join(HISTORY_DIR, `${today}.json`);
  const data = {
    date: today,
    savedAt: new Date().toISOString(),
    matches: matches
  };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// 서버 시작
const PORT = process.env.PORT || config.port;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║       🔗 trend-connector 실행중       ║
  ║                                       ║
  ║   http://localhost:${PORT}               ║
  ║                                       ║
  ╚═══════════════════════════════════════╝
  `);
});
