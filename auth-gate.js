// Simple PIN gate shown on every page before the site can be used.
// Once unlocked on a device, stays unlocked (localStorage) and signs into
// Firebase anonymously so Firestore security rules can require auth.
(function () {
  const PIN = '2569';
  const KEY = 'nn_pin_ok';

  function signInAnon() {
    if (typeof firebase !== 'undefined' && firebase.auth && !firebase.auth().currentUser) {
      firebase.auth().signInAnonymously().catch(e => console.warn('anon sign-in failed:', e));
    }
  }

  function removeGate() {
    const gate = document.getElementById('nn-auth-gate');
    if (gate) gate.remove();
    document.documentElement.style.overflow = '';
  }

  function unlock() {
    localStorage.setItem(KEY, 'true');
    signInAnon();
    removeGate();
  }

  function showGate() {
    const overlay = document.createElement('div');
    overlay.id = 'nn-auth-gate';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;background:linear-gradient(135deg,#6366f1,#ec4899);display:flex;align-items:center;justify-content:center;font-family:"Prompt","Itim",sans-serif;padding:20px;';
    overlay.innerHTML = `
      <div style="background:white;border-radius:24px;padding:36px 28px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,0.25);">
        <div style="font-size:3rem;margin-bottom:10px;">🔒</div>
        <h2 style="margin:0 0 8px 0;color:#312e81;font-size:1.3rem;">ใส่รหัสผ่านก่อนเข้าเล่นค่ะ</h2>
        <p style="color:#64748b;font-size:0.9rem;margin-bottom:18px;">ถามคุณพ่อคุณแม่ได้เลยนะคะ</p>
        <input id="nn-pin-input" type="text" inputmode="numeric" maxlength="4" placeholder="••••" style="font-size:1.8rem;letter-spacing:8px;text-align:center;width:100%;padding:12px;border:2px solid #c4b5fd;border-radius:12px;margin-bottom:14px;outline:none;box-sizing:border-box;">
        <div id="nn-pin-error" style="color:#ef4444;font-size:0.85rem;margin-bottom:10px;display:none;">รหัสไม่ถูกต้องค่ะ ลองใหม่นะคะ</div>
        <button id="nn-pin-submit" style="width:100%;padding:12px;border:none;border-radius:50px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:1.05rem;font-weight:bold;cursor:pointer;">เข้าเรียนเลย 🚀</button>
      </div>
    `;
    document.body.appendChild(overlay);
    document.documentElement.style.overflow = 'hidden';

    const input = document.getElementById('nn-pin-input');
    const errorMsg = document.getElementById('nn-pin-error');
    const submit = () => {
      if (input.value.trim() === PIN) {
        unlock();
      } else {
        errorMsg.style.display = 'block';
        input.value = '';
        input.focus();
      }
    };
    document.getElementById('nn-pin-submit').addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    setTimeout(() => input.focus(), 100);
  }

  function init() {
    if (localStorage.getItem(KEY) === 'true') {
      signInAnon();
      return;
    }
    showGate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
