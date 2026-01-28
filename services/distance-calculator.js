const path = require('path');

/**
 * 두 노트 간의 거리(이질성) 점수 계산
 * @param {Object} noteA - { path, folder, tags, keywords }
 * @param {Object} noteB - { path, folder, tags, keywords }
 * @returns {number} 0~100 (높을수록 이질적)
 */
function calculateDistance(noteA, noteB) {
  const folderDist = calculateFolderDistance(noteA.folder, noteB.folder);
  const tagDist = calculateTagDistance(noteA.tags, noteB.tags);
  const keywordDist = calculateKeywordDistance(noteA.keywords, noteB.keywords);

  return Math.min(100, folderDist + tagDist + keywordDist);
}

/**
 * 폴더 거리 (0~30)
 */
function calculateFolderDistance(folderA, folderB) {
  if (folderA === folderB) return 0;

  const partsA = folderA.split(path.sep);
  const partsB = folderB.split(path.sep);

  // 첫 번째 폴더가 같으면 15점, 완전히 다르면 30점
  if (partsA[0] === partsB[0]) return 15;
  return 30;
}

/**
 * 태그 거리 (0~40)
 */
function calculateTagDistance(tagsA, tagsB) {
  if (!tagsA.length || !tagsB.length) return 40;

  const setA = new Set(tagsA.map(t => t.toLowerCase()));
  const setB = new Set(tagsB.map(t => t.toLowerCase()));

  let commonCount = 0;
  for (const tag of setA) {
    if (setB.has(tag)) commonCount++;
  }

  if (commonCount >= 2) return 0;
  if (commonCount === 1) return 20;
  return 40;
}

/**
 * 키워드 거리 (0~30) - Jaccard 유사도의 역수
 */
function calculateKeywordDistance(keywordsA, keywordsB) {
  if (!keywordsA.length || !keywordsB.length) return 30;

  const setA = new Set(keywordsA.map(k => k.toLowerCase()));
  const setB = new Set(keywordsB.map(k => k.toLowerCase()));

  const intersection = [...setA].filter(k => setB.has(k)).length;
  const union = new Set([...setA, ...setB]).size;

  const jaccard = union > 0 ? intersection / union : 0;
  // jaccard 0 → 30점, jaccard 1 → 0점
  return Math.round((1 - jaccard) * 30);
}

module.exports = {
  calculateDistance,
  calculateFolderDistance,
  calculateTagDistance,
  calculateKeywordDistance
};
