const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Obsidian Vault를 스캔하여 키워드 인덱스 생성
 */
async function indexVault() {
  const keywords = {};
  const files = getAllMarkdownFiles(config.vaultPath);

  console.log(`[Indexer] ${files.length}개 파일 스캔 중...`);

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(config.vaultPath, filePath);
      const extractedKeywords = extractKeywords(content, relativePath);

      for (const keyword of extractedKeywords) {
        if (!keywords[keyword]) {
          keywords[keyword] = [];
        }
        if (!keywords[keyword].includes(relativePath)) {
          keywords[keyword].push(relativePath);
        }
      }
    } catch (err) {
      console.error(`[Indexer] 파일 읽기 실패: ${filePath}`);
    }
  }

  // 저장
  const outputPath = path.join(__dirname, '../data/keywords.json');
  fs.writeFileSync(outputPath, JSON.stringify(keywords, null, 2), 'utf-8');

  const keywordCount = Object.keys(keywords).length;
  console.log(`[Indexer] 완료: ${keywordCount}개 키워드, ${files.length}개 파일`);

  return keywords;
}

/**
 * 디렉토리에서 모든 .md 파일 찾기
 */
function getAllMarkdownFiles(dirPath, files = []) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    // 숨김 폴더 제외
    if (item.startsWith('.')) continue;

    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getAllMarkdownFiles(fullPath, files);
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 파일에서 키워드 추출
 */
function extractKeywords(content, filePath) {
  const keywords = new Set();

  // 1. 파일명에서 키워드 (확장자 제거)
  const fileName = path.basename(filePath, '.md');
  keywords.add(fileName.toLowerCase());

  // 2. 폴더명에서 키워드
  const folderName = path.dirname(filePath).split(path.sep)[0];
  if (folderName && folderName !== '.') {
    keywords.add(folderName.toLowerCase());
  }

  // 3. 해시태그 추출
  const hashtagRegex = /#([가-힣a-zA-Z0-9_]+)/g;
  let match;
  while ((match = hashtagRegex.exec(content)) !== null) {
    keywords.add(match[1].toLowerCase());
  }

  // 4. config의 키워드 매핑에서 매칭
  const contentLower = content.toLowerCase();
  for (const [korean, englishList] of Object.entries(config.keywordMapping)) {
    // 한글 키워드 체크
    if (contentLower.includes(korean.toLowerCase())) {
      keywords.add(korean.toLowerCase());
      englishList.forEach(en => keywords.add(en.toLowerCase()));
    }
    // 영어 키워드 체크
    for (const english of englishList) {
      if (contentLower.includes(english.toLowerCase())) {
        keywords.add(korean.toLowerCase());
        keywords.add(english.toLowerCase());
      }
    }
  }

  return Array.from(keywords);
}

// 직접 실행 시
if (require.main === module) {
  indexVault().then(() => {
    console.log('[Indexer] 인덱싱 완료');
  });
}

module.exports = { indexVault, getAllMarkdownFiles };
