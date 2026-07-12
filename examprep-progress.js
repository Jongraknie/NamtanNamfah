// Shared progress/coin/streak tracking for the Midterm Exam Learning Map.
// Read by examprep-map.html to render islands; written by tutor.html when a quiz finishes.
// Pure localStorage, no Firebase dependency, so it always works offline.
(function (global) {
  const PROGRESS_KEY = 'examMapProgress';
  const COINS_KEY = 'examMapCoins';
  const DATES_KEY = 'examMapPlayDates';
  const REWARD_KEY = 'examMapLastReward';

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

  // Called once per finished quiz. Merges the best result in, tops up coins, logs today's play date.
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

  // Awards a one-per-calendar-day login bonus. Returns null if already claimed today.
  function claimDailyReward() {
    if (localStorage.getItem(REWARD_KEY) === todayStr()) return null;
    localStorage.setItem(REWARD_KEY, todayStr());
    const coins = loadCoins() + 10;
    localStorage.setItem(COINS_KEY, String(coins));
    return { coinsEarned: 10, totalCoins: coins };
  }

  // Consecutive-day streak counting back from today (or yesterday, if today has no play yet).
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

  global.ExamMapProgress = {
    loadProgress, loadCoins, loadPlayDates,
    recordTopicResult, claimDailyReward, computeStreak,
    todayStr, starsFor
  };
})(window);
