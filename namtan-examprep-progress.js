// Shared progress/coin/streak tracking for น้ำตาล's (Grade 6) Midterm Prep Galaxy map.
// Mirrors examprep-progress.js's design (used by น้ำฟ้า's map) but with separate
// localStorage keys so the two children's progress never collide.
// Read by namtan-examprep-map.html to render chapters; written by tutor.html on quiz
// finish and by namtan-math-midterm-exam.html on mock-exam submit.
(function (global) {
  const PROGRESS_KEY = 'namtanExamMapProgress';
  const COINS_KEY = 'namtanExamMapCoins';
  const DATES_KEY = 'namtanExamMapPlayDates';
  const REWARD_KEY = 'namtanExamMapLastReward';
  const EXAM_HISTORY_KEY = 'namtanMockExamHistory';

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  function starsFor(correctCount, total) {
    const ratio = total ? correctCount / total : 0;
    if (ratio >= 0.9) return 3;
    if (ratio >= 0.6) return 2;
    if (ratio >= 0.3) return 1;
    return 0;
  }

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch (e) { return {}; }
  }
  function loadCoins() { return parseInt(localStorage.getItem(COINS_KEY) || '0', 10) || 0; }
  function loadPlayDates() {
    try { return JSON.parse(localStorage.getItem(DATES_KEY) || '[]'); } catch (e) { return []; }
  }
  function loadExamHistory() {
    try { return JSON.parse(localStorage.getItem(EXAM_HISTORY_KEY) || '[]'); } catch (e) { return []; }
  }

  function recordTopicResult(topicId, correctCount, total, score) {
    const stars = starsFor(correctCount, total);
    const progress = loadProgress();
    const prev = progress[topicId] || { stars: 0, bestScore: 0, playCount: 0 };
    const isNewBestStars = stars > prev.stars;
    const isFirstPlay = !prev.playCount;

    progress[topicId] = {
      stars: Math.max(prev.stars, stars),
      bestScore: Math.max(prev.bestScore, score || 0),
      playCount: (prev.playCount || 0) + 1,
      lastPlayed: todayStr()
    };
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

    let coinsEarned = correctCount * 5;
    if (isNewBestStars) coinsEarned += 20;
    if (isFirstPlay) coinsEarned += 20;
    const coins = loadCoins() + coinsEarned;
    localStorage.setItem(COINS_KEY, String(coins));

    const dates = loadPlayDates();
    if (!dates.includes(todayStr())) {
      dates.push(todayStr());
      localStorage.setItem(DATES_KEY, JSON.stringify(dates));
    }

    return { stars, isNewBestStars, coinsEarned, totalCoins: coins };
  }

  // Records a completed mock exam attempt (Part 1 auto-scored + Part 2 self-checked marks).
  function recordMockExam(entry) {
    const history = loadExamHistory();
    history.unshift({ ...entry, date: todayStr() });
    localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
    const coins = loadCoins() + 50;
    localStorage.setItem(COINS_KEY, String(coins));
    const dates = loadPlayDates();
    if (!dates.includes(todayStr())) {
      dates.push(todayStr());
      localStorage.setItem(DATES_KEY, JSON.stringify(dates));
    }
    return { coinsEarned: 50, totalCoins: coins };
  }

  function claimDailyReward() {
    if (localStorage.getItem(REWARD_KEY) === todayStr()) return null;
    localStorage.setItem(REWARD_KEY, todayStr());
    const coins = loadCoins() + 10;
    localStorage.setItem(COINS_KEY, String(coins));
    return { coinsEarned: 10, totalCoins: coins };
  }

  function computeStreak() {
    const dates = new Set(loadPlayDates());
    let streak = 0;
    const cursor = new Date();
    if (!dates.has(todayStr())) cursor.setDate(cursor.getDate() - 1);
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  global.NamtanExamProgress = {
    loadProgress, loadCoins, loadPlayDates, loadExamHistory,
    recordTopicResult, recordMockExam, claimDailyReward, computeStreak,
    todayStr, starsFor
  };
})(window);
