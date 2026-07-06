// Shared Firebase configuration and initialization.
// Loaded via <script> tag (compat SDK) before firebase-helpers.js on every page.
const firebaseConfig = {
  apiKey: "AIzaSyAvUkEIgHV1OxFzgCJTxGVsc2Ofian0T5g",
  authDomain: "tanfah-be9e1.firebaseapp.com",
  projectId: "tanfah-be9e1",
  storageBucket: "tanfah-be9e1.firebasestorage.app",
  messagingSenderId: "924883708987",
  appId: "1:924883708987:web:54d5b9c414fef86e4c401e",
  measurementId: "G-EQQ5EGE4BD"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;
