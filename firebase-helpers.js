// Shared cloud sync helpers (visit logging + cross-device leaderboards).
// Requires firebase-app-compat.js, firebase-firestore-compat.js and firebase-config.js to be loaded first.
// Every function fails silently (console.warn only) and never throws, so pages keep working offline
// using their existing localStorage logic.

// Rough device-type detection from the user agent (มือถือ/แท็บเล็ต/คอมพิวเตอร์) for the stats page.
function detectDeviceType() {
  const ua = navigator.userAgent || '';
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) return 'แท็บเล็ต';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'มือถือ';
  return 'คอมพิวเตอร์';
}

// Logs a play session: who played, which game/lesson, and from what device. Used by the stats page.
function fbLogActivity(name, gameLabel) {
  if (!db) return;
  try {
    db.collection('activity_log').add({
      name: String(name || '').slice(0, 20),
      game: String(gameLabel || '').slice(0, 60),
      device: detectDeviceType(),
      date: new Date().toISOString()
    }).catch(e => console.warn('fbLogActivity failed:', e));
  } catch (e) {
    console.warn('fbLogActivity failed:', e);
  }
}

function fbLoadAllActivity(callback) {
  if (!db) { callback(null); return; }
  db.collection('activity_log').orderBy('date', 'desc').limit(200).get()
    .then(snapshot => {
      const list = [];
      snapshot.forEach(doc => list.push(doc.data()));
      callback(list);
    })
    .catch(e => { console.warn('fbLoadAllActivity failed:', e); callback(null); });
}

function fbLogVisit() {
  if (!db) return;
  try {
    const now = new Date();
    db.collection('visits').add({
      date: now.toISOString().slice(0, 10),
      time: now.toISOString()
    }).catch(e => console.warn('fbLogVisit failed:', e));
  } catch (e) {
    console.warn('fbLogVisit failed:', e);
  }
}

function fbLoadAllVisits(callback) {
  if (!db) { callback(null); return; }
  db.collection('visits').get()
    .then(snapshot => {
      const list = [];
      snapshot.forEach(doc => list.push(doc.data()));
      callback(list);
    })
    .catch(e => { console.warn('fbLoadAllVisits failed:', e); callback(null); });
}

// entry: { name, score, title? }
function fbSaveScore(collectionName, entry) {
  if (!db) return;
  try {
    db.collection(collectionName).add({
      name: String(entry.name || '').slice(0, 20),
      score: Number(entry.score) || 0,
      title: entry.title ? String(entry.title).slice(0, 20) : null,
      date: new Date().toISOString()
    }).catch(e => console.warn('fbSaveScore failed:', e));
  } catch (e) {
    console.warn('fbSaveScore failed:', e);
  }
}

// Loads and returns the top 5 scores (best score per name+title), or null via callback on failure.
function fbLoadTopScores(collectionName, callback) {
  if (!db) { callback(null); return; }
  db.collection(collectionName).orderBy('score', 'desc').limit(100).get()
    .then(snapshot => {
      const best = {};
      snapshot.forEach(doc => {
        const d = doc.data();
        const key = (d.name || '').toLowerCase() + '|' + (d.title || '');
        if (!best[key] || d.score > best[key].score) best[key] = d;
      });
      const top = Object.values(best).sort((a, b) => b.score - a.score).slice(0, 5);
      callback(top);
    })
    .catch(e => { console.warn('fbLoadTopScores failed:', e); callback(null); });
}
