/* ==========================================================================
   GEAR & GAME SYSTEM SCRIPT - "เกาะคณิตศาสตร์มหัศจรรย์"
   ========================================================================== */

// --- AUDIO & VOICE UTILITIES ---
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Resume context if suspended (browser security)
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute(isMuted) {
    this.muted = isMuted;
  }

  // Synthesize a correct answer sound (rising bright major chord)
  playCorrect() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Play two notes in quick succession (C5 then E5)
    this.playTone(523.25, 0.1, 0.15, 'sine'); // C5
    setTimeout(() => {
      this.playTone(659.25, 0.1, 0.25, 'sine'); // E5
      this.playTone(783.99, 0.1, 0.35, 'sine'); // G5
    }, 80);
  }

  // Synthesize a wrong answer sound (falling low buzzer)
  playWrong() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Synthesize a bunny hop sound (sliding pitch up then down)
  playJump() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.45);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Synthesize an ice cream scoop landing sound
  playScoop() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    this.playTone(300, 0.05, 0.1, 'triangle');
    setTimeout(() => {
      this.playTone(180, 0.05, 0.12, 'sine');
    }, 50);
  }

  // Synthesize a chest opening sound (rapid arpeggio)
  playChestOpen() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 0.08, 0.15, 'sine');
      }, idx * 60);
    });
  }

  // Synthesize a triumphant fanfare for winning
  playVictory() {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const chord = [392.00, 523.25, 659.25]; // G4, C5, E5
    
    // Initial blast
    chord.forEach(freq => this.playTone(freq, 0.2, 0.4, 'triangle'));
    
    // Triumphant ending
    setTimeout(() => {
      const finalChord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      finalChord.forEach(freq => this.playTone(freq, 0.5, 0.8, 'sine'));
    }, 300);
  }

  // Helper method to play a single tone
  playTone(freq, attack, duration, type = 'sine') {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + duration);
  }
}

const sounds = new SoundFX();

// --- TEXT TO SPEECH (TTS) SYSTEM ---
let ttsEnabled = true;
let autoSpeak = true;

function speakText(text, lang = 'th-TH') {
  if (!ttsEnabled) return;
  
  // Cancel current speech if any
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = lang.includes('en') ? 0.82 : 0.92; // Slightly slower English for Thai kids
  utterance.pitch = 1.15; // Cute high pitch
  
  const voices = window.speechSynthesis.getVoices();
  const searchLang = lang.split('-')[0];
  const targetVoice = voices.find(voice => voice.lang.toLowerCase().includes(searchLang.toLowerCase()));
  if (targetVoice) {
    utterance.voice = targetVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}

// In some browsers voices load asynchronously
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {};
}


// --- GLOBAL STATE & CONFIGURATION ---
const state = {
  // Game Settings (Teacher configured)
  settings: {
    carrotDifficulty: 'easy', // easy, medium, hard
    icecreamTypes: ['place-value', 'expanded-form'],
    geometryTypes: ['compare', 'pattern']
  },
  
  // Current game states
  activeGame: null, // carrot, icecream, geometry
  score: 0,
  currentQuestionIndex: 0,
  correctCount: 0,
  totalQuestions: 10,
  
  // Questions array for active game session
  questions: [],
  currentQuestion: null,
  
  // Carrot game specific
  bunnyPosition: 0, // 0 to 9 index of path blocks
};

// --- QUESTION GENERATORS ---

function generateCarrotQuestions(difficulty, count) {
  const list = [];
  for (let i = 0; i < count; i++) {
    let num1, num2, answer, questionText, speakPrompt;
    
    if (difficulty === 'easy') {
      const u1 = Math.floor(Math.random() * 8) + 1;
      const u2 = Math.floor(Math.random() * (9 - u1));
      
      const t1 = Math.floor(Math.random() * 8) + 1;
      const t2 = Math.floor(Math.random() * (9 - t1));
      
      num1 = t1 * 10 + u1;
      num2 = t2 * 10 + u2;
      answer = num1 + num2;
    } else if (difficulty === 'medium') {
      num1 = Math.floor(Math.random() * 200) + 50;
      num2 = Math.floor(Math.random() * 200) + 50;
      answer = num1 + num2;
    } else {
      num1 = Math.floor(Math.random() * 400) + 100;
      num2 = Math.floor(Math.random() * 400) + 100;
      answer = num1 + num2;
    }
    
    questionText = `${num1} + ${num2} เท่ากับเท่าไรเอ่ย?`;
    speakPrompt = `${num1} บวก ${num2} เท่ากับเท่าไร`;
    
    const choices = generateChoices(answer, 10, 1000);
    
    const ones1 = num1 % 10;
    const ones2 = num2 % 10;
    const tens1 = Math.floor((num1 % 100) / 10);
    const tens2 = Math.floor((num2 % 100) / 10);
    const hund1 = Math.floor(num1 / 100);
    const hund2 = Math.floor(num2 / 100);
    
    let explanation = `<strong>เฉลยคำตอบ:</strong> ตอบ <strong>${answer}</strong> ค่ะ! <br>` +
                      `เพราะเมื่อเราตั้งบวกตามหลักทีละหลักจากขวาไปซ้าย (หลักหน่วย ➡️ หลักสิบ ➡️ หลักร้อย) จะได้คำตอบดังนี้ค่ะ:<br>` +
                      `• <strong>หลักหน่วย:</strong> ${ones1} + ${ones2} = ${ones1 + ones2}<br>` +
                      `• <strong>หลักสิบ:</strong> ${tens1} + ${tens2} = ${tens1 + tens2}<br>`;
    
    if (hund1 > 0 || hund2 > 0) {
      explanation += `• <strong>หลักร้อย:</strong> ${hund1} + ${hund2} = ${hund1 + hund2}<br>`;
    }
    
    explanation += `<br><strong>ตัวเลือกอื่นๆ:</strong> ตัวเลือกค่าจำนวนอื่นๆ ไม่ถูกต้อง เนื่องจากเป็นผลลัพธ์ที่คลาดเคลื่อนจากการบวกเลขหรือลืมบวกตัวทดในแต่ละหลักค่ะ<br>` +
                   `<br><strong>หลักการสำคัญ:</strong> ในการบวกเลขหลายหลัก ให้เริ่มตั้งบวกตรงหลักจากขวาสุดไปซ้ายสุด (หลักหน่วย ➡️ หลักสิบ ➡️ หลักร้อย) และหากผลรวมหลักใดเกิน 9 ให้ทดเลข 1 ไปยังหลักซ้ายมือเสมอนะคะ!`;
    
    list.push({
      questionText,
      speakPrompt,
      answer,
      choices,
      explanation
    });
  }
  return list;
}

// Ice Cream game: Place value & Expanded form
function generateIceCreamQuestions(types, count) {
  const list = [];
  const activeTypes = types.length > 0 ? types : ['place-value', 'expanded-form'];
  
  for (let i = 0; i < count; i++) {
    const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
    const num = Math.floor(Math.random() * 900) + 100;
    const digits = num.toString().split('').map(Number);
    
    let questionText, speakPrompt, answer, choices, explanation;
    
    if (type === 'place-value') {
      if (Math.random() > 0.5) {
        const placeIndex = Math.floor(Math.random() * 3);
        const placeNames = ['ร้อย', 'สิบ', 'หน่วย'];
        const targetDigit = digits[placeIndex];
        
        questionText = `ในจำนวน ${num} เลขโดด ${targetDigit} อยู่ในหลักใดเอ่ย?`;
        speakPrompt = `ในจำนวน ${num} เลขโดด ${targetDigit} อยู่ในหลักใด`;
        answer = `หลัก${placeNames[placeIndex]}`;
        choices = ['หลักหน่วย', 'หลักสิบ', 'หลักร้อย'].sort(() => 0.5 - Math.random());
        
        explanation = `<strong>เฉลยคำตอบ:</strong> ตอบ <strong>หลัก${placeNames[placeIndex]}</strong> ค่ะ! <br>` +
                      `เพราะในจำนวน <strong>${num}</strong> นั้น เลขโดด <strong>${targetDigit}</strong> ตั้งอยู่ตำแหน่งที่ ${placeIndex === 0 ? 'หนึ่งจากซ้ายสุด นั่นคือหลักร้อย' : placeIndex === 1 ? 'สองตรงกลาง นั่นคือหลักสิบ' : 'สามขวาสุด นั่นคือหลักหน่วย'} ค่ะ<br>` +
                      `<br><strong>ตัวเลือกอื่นๆ:</strong> ตัวเลือกหลักตำแหน่งอื่นๆ ไม่ถูกต้อง เนื่องจากระบุตำแหน่งหลักคลาดเคลื่อนไปจากตำแหน่งจริงของตัวเลขโดดนั้นค่ะ<br>` +
                      `<br><strong>หลักการสำคัญ:</strong> การพิจารณาตำแหน่งหลักของจำนวนสามหลัก จะเริ่มนับจากขวาไปซ้ายเสมอ ได้แก่ หลักหน่วย (ขวาสุด) ➡️ หลักสิบ (ตรงกลาง) ➡️ หลักร้อย (ซ้ายสุด) ค่ะ`;
      } else {
        const placeIndex = Math.floor(Math.random() * 3);
        const placeNames = ['ร้อย', 'สิบ', 'หน่วย'];
        const values = [100, 10, 1];
        const targetDigit = digits[placeIndex];
        answer = targetDigit * values[placeIndex];
        
        questionText = `ในจำนวน ${num} เลขโดด ${targetDigit} ในหลัก${placeNames[placeIndex]} มีค่าเท่าไร?`;
        speakPrompt = `ในจำนวน ${num} เลขโดด ${targetDigit} ในหลัก${placeNames[placeIndex]} มีค่าเท่าไร`;
        
        const s = new Set([answer]);
        s.add(targetDigit * 100);
        s.add(targetDigit * 10);
        s.add(targetDigit);
        while (s.size < 4) {
          s.add(Math.floor(Math.random() * 9 + 1) * 10);
        }
        choices = Array.from(s).sort(() => 0.5 - Math.random());
        
        explanation = `<strong>เฉลยคำตอบ:</strong> ตอบ <strong>${answer}</strong> ค่ะ! <br>` +
                      `เพราะเลขโดด <strong>${targetDigit}</strong> เมื่อไปตั้งอยู่ในตำแหน่ง <strong>หลัก${placeNames[placeIndex]}</strong> จะต้องมีค่าคูณด้วยค่าประจำหลัก (${values[placeIndex]}) ซึ่งทำให้มันมีค่าเท่ากับ ${targetDigit} x ${values[placeIndex]} = ${answer} ค่ะ<br>` +
                      `<br><strong>ตัวเลือกอื่นๆ:</strong> ตัวเลือกตัวเลขค่าอื่นๆ ไม่ถูกต้อง เนื่องจากเป็นค่าของเลขโดดตัวนี้หากย้ายไปตั้งอยู่ในตำแหน่งหลักอื่นๆ ค่ะ<br>` +
                      `<br><strong>หลักการสำคัญ:</strong> ค่าของเลขโดดหาได้โดยนำ 'เลขโดดตัวนั้น คูณกับ ค่าประจำตำแหน่งของหลัก' (หลักร้อยมีค่าประจำหลัก 100, หลักสิบคือ 10, หลักหน่วยคือ 1) ค่ะ`;
      }
    } else {
      if (Math.random() > 0.5) {
        questionText = `เขียนรูปกระจายของ ${num} ได้ถูกต้องอย่างไรเอ่ย?`;
        speakPrompt = `เขียนรูปกระจายของ ${num} ได้ถูกต้องอย่างไร`;
        
        const hVal = digits[0] * 100;
        const tVal = digits[1] * 10;
        const oVal = digits[2];
        answer = `${hVal} + ${tVal} + ${oVal}`;
        
        const distractors = [
          `${hVal} + ${tVal}0 + ${oVal}`,
          `${hVal} + ${tVal} + ${oVal}0`,
          `${digits[0]} + ${digits[1]} + ${digits[2]}`,
          `${hVal} + ${oVal}`,
          `${hVal} + ${tVal}`
        ];
        const filtered = distractors.filter(d => d !== answer).sort(() => 0.5 - Math.random()).slice(0, 3);
        choices = [answer, ...filtered].sort(() => 0.5 - Math.random());
        
        explanation = `<strong>เฉลยคำตอบ:</strong> ตอบ <strong>${answer}</strong> ค่ะ! <br>` +
                      `เพราะการเขียนในรูปกระจาย คือการแยกดึงค่าของเลขโดดแต่ละหลักมาบวกรวมกัน ซึ่งก็คือการนำค่าหลักร้อย (${hVal}) หลักสิบ (${tVal}) และหลักหน่วย (${oVal}) มาเขียนเชื่อมด้วยเครื่องหมายบวก (+) ค่ะ<br>` +
                      `<br><strong>ตัวเลือกอื่นๆ:</strong> ตัวเลือกเขียนรูปกระจายแบบอื่นๆ ไม่ถูกต้อง เนื่องจากคำนวณเติมเลขศูนย์ (0) ของค่าประจำหลักในบางหลักผิดสัดส่วนไปจากความจริงค่ะ<br>` +
                      `<br><strong>หลักการสำคัญ:</strong> รูปกระจายของจำนวนสามหลัก จะต้องเขียนอยู่ในรูป 'ค่าหลักร้อย + ค่าหลักสิบ + ค่าหลักหน่วย' เสมอค่ะ`;
      } else {
        const hVal = digits[0] * 100;
        const tVal = digits[1] * 10;
        const oVal = digits[2];
        
        questionText = `จำนวนที่มีรูปกระจายเป็น ${hVal} + ${tVal} + ${oVal} คือจำนวนใด?`;
        speakPrompt = `จำนวนที่มีรูปกระจายเป็น ${hVal} บวก ${tVal} บวก ${oVal} คือจำนวนใด`;
        answer = num;
        choices = generateChoices(answer, 100, 999);
        
        explanation = `<strong>เฉลยคำตอบ:</strong> ตอบ <strong>${num}</strong> ค่ะ! <br>` +
                      `เพราะเมื่อเรานำค่าของตัวเลขในแต่ละหลักมารวมคืนกลับมา ได้แก่ ค่าหลักร้อย (${hVal}) บวกค่าหลักสิบ (${tVal}) และบวกค่าหลักหน่วย (${oVal}) จะประกอบกันขึ้นมาเป็นจำนวน <strong>${num}</strong> พอดีค่ะ<br>` +
                      `<br><strong>ตัวเลือกอื่นๆ:</strong> ตัวเลือกจำนวนจำนวนอื่นๆ ไม่ถูกต้อง เนื่องจากมีค่าในหลักร้อยหรือหลักสิบบางหลักไม่ตรงกับรูปกระจายที่โจทย์ระบุค่ะ<br>` +
                      `<br><strong>หลักการสำคัญ:</strong> รูปกระจายสามารถบอกตัวเลขเดี่ยวในแต่ละตำแหน่งของหลักได้ทันที เพียงแค่นำตัวเลขหลักร้อย หลักสิบ และหลักหน่วยกลับมาเขียนเรียงชิดกันเป็นจำนวนเดียวค่ะ`;
      }
    }
    
    list.push({
      questionText,
      speakPrompt,
      answer,
      choices,
      explanation
    });
  }
  return list;
}

// Ocean Compare & Pattern (Undersea Game)
function generateGeometryQuestions(types, count) {
  const list = [];
  const activeTypes = types.length > 0 ? types : ['compare', 'pattern'];
  
  for (let i = 0; i < count; i++) {
    const type = activeTypes[Math.floor(Math.random() * activeTypes.length)];
    let questionText, speakPrompt, answer, choices, display, explanation;
    
    if (type === 'compare') {
      const num1 = Math.floor(Math.random() * 900) + 100;
      let num2 = Math.floor(Math.random() * 900) + 100;
      
      if (Math.random() > 0.8) {
        num2 = num1;
      }
      
      if (num1 > num2) {
        answer = '>';
      } else if (num1 < num2) {
        answer = '<';
      } else {
        answer = '=';
      }
      
      questionText = `เปรียบเทียบ ${num1} กับ ${num2} ควรเติมเครื่องหมายใดลงในช่องว่างเอ่ย?`;
      speakPrompt = `เปรียบเทียบ ${num1} กับ ${num2} ควรเติมเครื่องหมายใด`;
      choices = ['>', '<', '='];
      
      display = `
        <div class="comparison-display">
          <div class="bubble-num">${num1}</div>
          <div class="bubble-symbol">?</div>
          <div class="bubble-num">${num2}</div>
        </div>`;
        
      explanation = `<strong>เฉลยคำตอบ:</strong> ตอบ <strong>${answer}</strong> ค่ะ! <br>` +
                    `เพราะเมื่อนำจำนวนฝั่งซ้าย (<strong>${num1}</strong>) มาเปรียบเทียบเชิงปริมาณกับจำนวนฝั่งขวา (<strong>${num2}</strong>) พบว่า ${num1} มีค่า${num1 > num2 ? 'มากกว่า' : num1 < num2 ? 'น้อยกว่า' : 'เท่ากับ'} ${num2} เครื่องหมายที่ตรงกับความสัมพันธ์นี้จึงคือเครื่องหมาย <strong>${answer}</strong> ค่ะ<br>` +
                    `<br><strong>ตัวเลือกอื่นๆ:</strong> ตัวเลือกเครื่องหมายอื่นๆ ไม่ถูกต้อง เนื่องจากจะทำให้ระดับสัญลักษณ์แสดงการเปรียบเทียบระหว่างตัวเลขสองฝั่งไม่ตรงตามความเป็นจริงค่ะ<br>` +
                    `<br><strong>หลักการสำคัญ:</strong> ในการเปรียบเทียบค่าของสองจำนวน ให้เริ่มเปรียบเทียบจากหลักซ้ายสุดก่อน (หลักร้อย) หากหลักร้อยมีค่าเท่ากัน จึงค่อยเปรียบเทียบหลักสิบ และหลักหน่วยถัดไปตามลำดับค่ะ`;
    } else {
      if (Math.random() > 0.5) {
        const steps = [5, 10, 50, 100];
        const step = steps[Math.floor(Math.random() * steps.length)];
        const start = Math.floor(Math.random() * 400) + 100;
        
        const seq = [start, start + step, start + 2 * step, start + 3 * step];
        const missingIndex = Math.floor(Math.random() * 4);
        answer = seq[missingIndex];
        
        questionText = `จำนวนที่หายไปในแบบรูป: ${seq.map((v, idx) => idx === missingIndex ? '___' : v).join(', ')} คือจำนวนใด?`;
        speakPrompt = `จำนวนที่หายไปในแบบรูปคือจำนวนใด`;
        choices = generateChoices(answer, 10, 1000);
        
        display = `
          <div class="pattern-display">
            ${seq.map((v, idx) => idx === missingIndex ? '<div class="bubble-num question-mark">?</div>' : `<div class="bubble-num">${v}</div>`).join('')}
          </div>`;
          
        explanation = `<strong>เฉลยคำตอบ:</strong> ตอบ <strong>${answer}</strong> ค่ะ! <br>` +
                      `เพราะแบบรูปอนุกรมชุดนี้มีความสัมพันธ์แบบเพิ่มขึ้นอย่างคงที่ทีละ <strong>+${step}</strong> ดังนั้นตัวเลขที่หายไปจึงเกิดจากการบวกเพิ่ม ${step} เข้าไปกับจำนวนก่อนหน้า หรือหักลบออกจากจำนวนด้านขวาค่ะ<br>` +
                      `<br><strong>ตัวเลือกอื่นๆ:</strong> ตัวเลือกจำนวนอื่นๆ ไม่ถูกต้อง เนื่องจากเมื่อนำมาใส่ในช่องว่างแล้วจะทำให้ทิศทางความห่างระหว่างตัวเลขคลาดเคลื่อน ไม่เพิ่มขึ้นคงที่เท่ากันค่ะ<br>` +
                      `<br><strong>หลักการสำคัญ:</strong> วิธีหาแบบรูปคือให้เปรียบเทียบหาผลต่างของจำนวนที่อยู่ติดกันก่อน เพื่อพิจารณาว่าความสัมพันธ์นั้นเป็นการเพิ่มขึ้น (+) หรือลดลง (-) ทีละเท่าใด แล้วจึงนำระยะผลต่างนั้นมาหาคำตอบตัวเลขในช่องว่างค่ะ`;
      } else {
        const n1 = Math.floor(Math.random() * 900) + 100;
        let n2 = Math.floor(Math.random() * 900) + 100;
        while (n2 === n1) n2 = Math.floor(Math.random() * 900) + 100;
        let n3 = Math.floor(Math.random() * 900) + 100;
        while (n3 === n1 || n3 === n2) n3 = Math.floor(Math.random() * 900) + 100;
        
        const isMax = Math.random() > 0.5;
        if (isMax) {
          answer = Math.max(n1, n2, n3);
          questionText = `จำนวนใดมีค่ามากที่สุดในกลุ่มนี้: ${n1}, ${n2}, และ ${n3}?`;
          speakPrompt = `จำนวนใดมีค่ามากที่สุดในกลุ่มนี้`;
        } else {
          answer = Math.min(n1, n2, n3);
          questionText = `จำนวนใดมีค่าน้อยที่สุดในกลุ่มนี้: ${n1}, ${n2}, และ ${n3}?`;
          speakPrompt = `จำนวนใดมีค่าน้อยที่สุดในกลุ่มนี้`;
        }
        
        choices = [n1, n2, n3].sort(() => 0.5 - Math.random());
        while (choices.length < 4) {
          const dist = Math.floor(Math.random() * 900) + 100;
          if (!choices.includes(dist)) choices.push(dist);
        }
        choices.sort(() => 0.5 - Math.random());
        
        display = `
          <div class="pattern-display">
            <div class="bubble-num">${n1}</div>
            <div class="bubble-num">${n2}</div>
            <div class="bubble-num">${n3}</div>
          </div>`;
          
        explanation = `<strong>เฉลยคำตอบ:</strong> ตอบ <strong>${answer}</strong> ค่ะ! <br>` +
                      `เพราะเมื่อเรานำตัวเลขทั้งสามจำนวน (${n1}, ${n2}, และ ${n3}) มาเปรียบเทียบหาขนาดปริมาณค่าร่วมกัน พบว่าจำนวนที่มีค่า <strong>${isMax ? 'มากที่สุด' : 'น้อยที่สุด'}</strong> คือ <strong>${answer}</strong> ค่ะ<br>` +
                      `<br><strong>ตัวเลือกอื่นๆ:</strong> ตัวเลือกจำนวนอื่นๆ ที่เหลือนั้นเป็นตัวเลขที่มีค่าตรงกันข้าม หรือมีค่าอยู่ระหว่างกลางซึ่งไม่ตรงตามเงื่อนไขเปรียบเทียบที่โจทย์กำหนดค่ะ<br>` +
                      `<br><strong>หลักการสำคัญ:</strong> การหาจำนวนที่มากที่สุดหรือน้อยที่สุดในกลุ่มจำนวนหลายๆ จำนวน ให้ทำได้โดยการเริ่มเปรียบเทียบตัวเลขโดดหลักร้อย (ซ้ายสุด) ก่อนเพื่อนั่นเองค่ะ`;
      }
    }
    
    list.push({
      questionText,
      speakPrompt,
      answer,
      display,
      choices,
      explanation
    });
  }
  return list;
}

// English Questions Generator (Book 1 & Book 2)
function generateEnglishQuestions(bookNum, count) {
  const list = [];
  
  const book1Questions = [
    { q: "What color is the sky on a sunny day?", a: "blue", c: ["blue", "red", "yellow", "black"], speak: "What color is the sky on a sunny day?", exp: "<strong>Correct answer:</strong> ตอบ <strong>blue</strong> ค่ะ! เพราะในวันที่ท้องฟ้าแจ่มใส ท้องฟ้าตามธรรมชาติจะมีสีฟ้า ซึ่งคำศัพท์อังกฤษคือ blue ค่ะ<br><br><strong>Other choices:</strong> red คือสีแดง, yellow คือสีเหลือง, และ black คือสีดำ ซึ่งไม่ใช่สีของท้องฟ้าตามธรรมชาติค่ะ<br><br><strong>Key concept:</strong> ฝึกฝนทักษะการแปลความหมายคำศัพท์สีต่างๆ รอบตัวในชีวิตประจำวัน เช่น blue (สีฟ้า/น้ำเงิน), red (สีแดง), และ yellow (สีเหลือง)" },
    { q: "The grass is _________.", a: "green", c: ["green", "pink", "orange", "blue"], speak: "The grass is...", exp: "<strong>Correct answer:</strong> ตอบ <strong>green</strong> ค่ะ! เพราะใบไม้และต้นหญ้าตามธรรมชาติจะมีสีเขียว ซึ่งคำศัพท์ภาษาอังกฤษคือ green ค่ะ<br><br><strong>Other choices:</strong> pink แปลว่าสีชมพู, orange แปลว่าสีส้ม, และ blue แปลว่าสีฟ้า ซึ่งไม่ใช่สีทั่วไปของสนามหญ้าค่ะ<br><br><strong>Key concept:</strong> เชื่อมโยงคำศัพท์หมวดหมู่สิ่งแวดล้อม (grass = หญ้า) เข้ากับหมวดหมู่สีหลักของธรรมชาติ ซึ่งคือสีเขียว (green)" },
    { q: "Which fruit is red?", a: "apple", c: ["apple", "banana", "coconut", "orange"], speak: "Which fruit is red?", exp: "<strong>Correct answer:</strong> ตอบ <strong>apple</strong> ค่ะ! เพราะแอปเปิ้ลมีเปลือกภายนอกสีแดงสดใส ตรงตามคำศัพท์สี red ที่โจทย์ต้องการค้นหาค่ะ<br><br><strong>Other choices:</strong> banana (กล้วยมีสีเหลือง), coconut (มะพร้าวมีเปลือกสีเขียว/น้ำตาล), และ orange (ส้มมีผิวสีส้ม)<br><br><strong>Key concept:</strong> ทบทวนคำศัพท์ภาษาอังกฤษของผลไม้รอบตัวควบคู่ไปกับสีเด่นเฉพาะตัวของผลไม้แต่ละชนิดค่ะ" },
    { q: "A banana is _________.", a: "yellow", c: ["yellow", "green", "purple", "white"], speak: "A banana is...", exp: "<strong>Correct answer:</strong> ตอบ <strong>yellow</strong> ค่ะ! เพราะผลกล้วยที่สุกงอมพร้อมรับประทานจะมีสีเหลืองสด ซึ่งตรงกับคำศัพท์สี yellow ค่ะ<br><br><strong>Other choices:</strong> green (สีเขียวของกล้วยดิบ), purple (สีม่วง), และ white (สีขาว) ไม่ใช่ลักษณะสีผลกล้วยทั่วไปค่ะ<br><br><strong>Key concept:</strong> ฝึกจับคู่เชื่อมโยงระหว่างผลไม้ที่คุ้นเคยกับการระบุสีสุกงอมของมันด้วยคำศัพท์ภาษาอังกฤษให้ถูกต้อง" },
    { q: "Piglets are usually _________.", a: "pink", c: ["pink", "blue", "green", "black"], speak: "Piglets are usually...", exp: "<strong>Correct answer:</strong> ตอบ <strong>pink</strong> ค่ะ! เพราะลูกหมูตัวน้อย (piglet) ในภาพวาดและการเรียนรู้ทั่วไปมักจะมีสีชมพูอ่อนพาสเทล ซึ่งตรงกับคำว่า pink ค่ะ<br><br><strong>Other choices:</strong> blue (สีฟ้า), green (สีเขียว), และ black (สีดำ) ไม่ใช่สีตามธรรมชาติหรือภาพจำของลูกหมูสีชมพูทั่วไปค่ะ<br><br><strong>Key concept:</strong> เรียนรู้คำศัพท์น่าสนใจในชีวิตประจำวัน เช่นคำว่า piglet ที่แปลว่าลูกหมูตัวเล็ก และเรียนรู้สีเด่นของสัตว์ต่างๆ ค่ะ" },
    { q: "We _________ a new classroom.", a: "have", c: ["have", "is", "an", "under"], speak: "We... a new classroom.", exp: "<strong>Correct answer:</strong> ตอบ <strong>have</strong> ค่ะ! เพราะประธานของประโยคเป็นสรรพนามพหูพจน์ <strong>We</strong> (พวกเรา) จึงต้องใช้คู่กับกริยาแสดงความเป็นเจ้าของพหูพจน์คือ <strong>have</strong> (แปลว่า 'มี') ค่ะ<br><br><strong>Other choices:</strong> is เป็น Verb to be แปลว่าคือ, an คือคำนำหน้าคำนาม, และ under เป็นคำบุพบทบอกตำแหน่งใต้โต๊ะ ซึ่งใช้แทนไม่ได้ค่ะ<br><br><strong>Key concept:</strong> หลักไวยากรณ์ Verb to have: ประธานพหูพจน์ (I/You/We/They) ใช้คู่กับกริยา <strong>have</strong> ส่วนประธานเอกพจน์ (He/She/It) ใช้คู่กับ has ค่ะ" },
    { q: "It _________ a red pencil.", a: "is", c: ["is", "have", "these", "an"], speak: "It... a red pencil.", exp: "<strong>Correct answer:</strong> ตอบ <strong>is</strong> ค่ะ! เพราะสรรพนามประธานเอกพจน์ <strong>It</strong> (มัน) จะต้องทำหน้าที่คู่กับคำกริยา Verb to be รูปเอกพจน์คือ <strong>is</strong> (แปลว่า 'คือ') ค่ะ<br><br><strong>Other choices:</strong> have เป็นกริยาพหูพจน์แปลว่ามี, these เป็นคำสรรพนามชี้เฉพาะพหูพจน์, และ an เป็นคำนำหน้าคำนาม ซึ่งไม่สอดคล้องกับประโยคค่ะ<br><br><strong>Key concept:</strong> หลักไวยากรณ์ Verb to be: ประธานเอกพจน์บุรุษที่สาม <strong>It</strong> จะจับคู่สอดคล้องกับคำกริยา <strong>is</strong> เสมอในการแสดงสถานะ" },
    { q: "This is _________ elephant.", a: "an", c: ["an", "a", "is", "have"], speak: "This is... elephant.", exp: "<strong>Correct answer:</strong> ตอบ <strong>an</strong> ค่ะ! เพราะคำนามคำว่า <strong>elephant</strong> (ช้าง) ขึ้นต้นด้วยตัวอักษร <strong>E</strong> ซึ่งออกเสียงเป็นเสียงสระ (เอะ) จึงต้องใช้คำนำหน้าเป็น <strong>an</strong> ค่ะ<br><br><strong>Other choices:</strong> a ใช้คู่กับคำนามเดี่ยวที่ขึ้นต้นด้วยเสียงพยัญชนะทั่วไป, ส่วน is และ have เป็นคำกริยาแสดงอาการ ไม่ใช่คำนำหน้าคำนามค่ะ<br><br><strong>Key concept:</strong> หลักการใช้คำนำหน้านามเอกพจน์ (Articles): ใช้ <strong>an</strong> นำหน้าคำที่ขึ้นต้นและออกเสียงสระ (A, E, I, O, U) ส่วนเสียงอื่นๆ ใช้ <strong>a</strong>" },
    { q: "That is _________ ruler.", a: "a", c: ["a", "an", "is", "these"], speak: "That is... ruler.", exp: "<strong>Correct answer:</strong> ตอบ <strong>a</strong> ค่ะ! เพราะคำนามคำว่า <strong>ruler</strong> (ไม้บรรทัด) ขึ้นต้นคำด้วยตัวอักษร R ซึ่งส่งเสียงเป็นพยัญชนะทั่วไป จึงต้องใช้คำนำหน้าแสดงเอกพจน์ชิ้นเดียวเป็น <strong>a</strong> ค่ะ<br><br><strong>Other choices:</strong> an ใช้คู่กับนามเอกพจน์ที่ออกเสียงนำด้วยสระ, ส่วน is และ these ไม่ใช่คำนำหน้าคำนามเอกพจน์ในประโยคนี้ค่ะ<br><br><strong>Key concept:</strong> หลักการใช้ Articles: ใช้ <strong>a</strong> นำหน้าคำนามเอกพจน์ทั่วไปที่ขึ้นต้นด้วยเสียงพยัญชนะ (เช่น a ruler, a book, a pencil)" },
    { q: "_________ is a bird flying high in the sky.", a: "That", c: ["That", "These", "an", "is"], speak: "What is that in the sky?", exp: "<strong>Correct answer:</strong> ตอบ <strong>That</strong> ค่ะ! เพราะนกบินอยู่สูงบนท้องฟ้า (ระยะไกลตัวผู้พูด) และมีเพียงตัวเดียว (เอกพจน์) เราจึงต้องใช้คำบ่งชี้ว่า <strong>That</strong> (สิ่งนั้น/ตัวนั้น) ค่ะ<br><br><strong>Other choices:</strong> These ใช้ชี้สิ่งของหลายชิ้นที่อยู่ใกล้ตัว, ส่วน an และ is ไม่ใช่คำบ่งชี้บอกทิศทางและระยะทางของคำนามค่ะ<br><br><strong>Key concept:</strong> หลักคำบ่งชี้ระยะบอกตำแหน่ง (Demonstratives): ใช้ <strong>That</strong> กับคำนามเอกพจน์ชิ้นเดียวที่อยู่ไกลตัวผู้พูดค่ะ" },
    { q: "Look! _________ are pencils in my hand here.", a: "These", c: ["These", "those", "an", "is"], speak: "These are pencils in my hand.", exp: "<strong>Correct answer:</strong> ตอบ <strong>These</strong> ค่ะ! เพราะดินสอมีหลายแท่ง (พหูพจน์) และถูกถืออยู่ในมือผู้พูด (ระยะใกล้ตัว) เราจึงต้องใช้คำบ่งชี้ว่า <strong>These</strong> (สิ่งเหล่านี้) ค่ะ<br><br><strong>Other choices:</strong> those ใช้ชี้สิ่งของพหูพจน์ที่อยู่ห่างไกลตัวออกไป, ส่วน an และ is ไม่ใช่คำแสดงสรรพนามชี้พิกัดของคำนามค่ะ<br><br><strong>Key concept:</strong> หลักคำบ่งชี้ชี้พิกัด: ใช้ <strong>These</strong> เมื่อชี้บอกสิ่งของที่เป็นพหูพจน์ (มีหลายจำนวน) และวางอยู่ในระยะใกล้ผู้พูดค่ะ" },
    { q: "Look at _________ clouds far away.", a: "those", c: ["those", "these", "an", "is"], speak: "Look at those clouds far away.", exp: "<strong>Correct answer:</strong> ตอบ <strong>those</strong> ค่ะ! เพราะก้อนเมฆอยู่ลอยสูงไกลตัวออกไป (ระยะไกลตัว) และมีหลายก้อนเติม s (พหูพจน์) เราจึงต้องใช้คำบ่งชี้ว่า <strong>those</strong> (สิ่งเหล่านั้น) ค่ะ<br><br><strong>Other choices:</strong> these ใช้ชี้สิ่งของหลายชิ้นในระยะใกล้ตัวผู้พูด, ส่วน an และ is ไม่สามารถใช้ชี้บอกระยะทางของคำนามพหูพจน์ได้ค่ะ<br><br><strong>Key concept:</strong> หลักคำบ่งชี้บอกตำแหน่ง: ใช้ <strong>those</strong> กับคำนามพหูพจน์ (มีหลายจำนวน) ที่ลอยหรือตั้งอยู่ในระยะไกลตัวผู้พูดค่ะ" },
    { q: "The fish is _________ the water.", a: "in", c: ["in", "on", "under", "that"], speak: "The fish is... the water.", exp: "<strong>Correct answer:</strong> ตอบ <strong>in</strong> ค่ะ! เพราะปลาว่ายและอาศัยอยู่ภายในกระแสน้ำ คำบุพบทที่ระบุพิกัดว่าอยู่ภายในคือคำว่า <strong>in</strong> (ใน/ข้างใน) ค่ะ<br><br><strong>Other choices:</strong> on แปลว่าอยู่ข้างบนพื้นผิวสัมผัส, under แปลว่าอยู่ด้านล่างหรือข้างใต้, และ that คือคำบ่งชี้บอกระยะไม่ใช่คำระบุตำแหน่งค่ะ<br><br><strong>Key concept:</strong> คำบุพบทบอกทิศทาง (Prepositions of Place): ใช้ <strong>in</strong> ในการบ่งชี้พิกัดเมื่อวัตถุหนึ่งอยู่ภายใต้ขอบเขตหรือข้างในอีกสิ่งหนึ่ง" },
    { q: "The cat is sleeping _________ the table.", a: "under", c: ["under", "on", "in", "those"], speak: "The cat is sleeping... the table.", exp: "<strong>Correct answer:</strong> ตอบ <strong>under</strong> ค่ะ! เพราะแมวนอนหลับขดอยู่บริเวณด้านล่างของโต๊ะ ซึ่งระบุตำแหน่งโดยคำบุพบทว่า <strong>under</strong> (ข้างใต้/ใต้) ค่ะ<br><br><strong>Other choices:</strong> on แปลว่านอนด้านบนหน้าโต๊ะ, in แปลว่านอนข้างในเนื้อไม้โต๊ะ, และ those เป็นคำสรรพนามชี้พิกัดระยะไกลไม่ใช่คำระบุตำแหน่ง<br><br><strong>Key concept:</strong> คำบุพบทบอกพิกัด: ใช้ <strong>under</strong> เมื่อต้องการระบุว่าสิ่งของหรือสัตว์หนึ่งอยู่ด้านใต้ของโครงสร้างพื้นผิวอาคารหรือเฟอร์นิเจอร์ค่ะ" },
    { q: "The book is _________ the desk.", a: "on", c: ["on", "in", "under", "an"], speak: "The book is... the desk.", exp: "<strong>Correct answer:</strong> ตอบ <strong>on</strong> ค่ะ! เพราะหนังสือถูกวางตั้งอยู่บนหน้าโต๊ะเรียนแบบมีพื้นผิวสัมผัสรับน้ำหนัก ซึ่งบอกพิกัดด้วยคำบุพบทว่า <strong>on</strong> (บน) ค่ะ<br><br><strong>Other choices:</strong> in แปลว่าอยู่ข้างในลิ้นชักลึก, under แปลว่าอยู่ด้านใต้ขาโต๊ะ, และ an คือคำนำหน้านามเดี่ยวออกเสียงสระ<br><br><strong>Key concept:</strong> คำบุพบทบอกพิกัด: ใช้ <strong>on</strong> เมื่อวัตถุวางทับอยู่บนผิวสัมผัสของสิ่งของชิ้นอื่น (เช่น on the desk, on the wall)" }
  ];
  
  const book2Questions = [
    { q: "We read a _________ to learn lessons.", a: "book", c: ["book", "eraser", "pencil", "ruler"], speak: "We read a... to learn lessons.", exp: "<strong>Correct answer:</strong> ตอบ <strong>book</strong> ค่ะ! เพราะหนังสือเป็นสิ่งที่เรานำมาเปิดอ่าน (read) เพื่อเรียนรู้ศึกษาหาความรู้ในห้องเรียนค่ะ<br><br><strong>Other choices:</strong> eraser แปลว่ายางลบ, pencil แปลว่าดินสอ, และ ruler แปลว่าไม้บรรทัด ซึ่งสิ่งของเหล่านี้ไม่ได้มีไว้สำหรับเปิดอ่านตัวเนื้อหาค่ะ<br><br><strong>Key concept:</strong> ทบทวนคำศัพท์อุปกรณ์การเรียน และเรียนรู้ความสัมพันธ์ระหว่างกริยาอาการ (read = อ่าน) คู่กับคำนามที่สอดรับกัน (book = หนังสือ)" },
    { q: "I write my name with a _________.", a: "pencil", c: ["pencil", "chair", "bag", "classroom"], speak: "I write my name with a...", exp: "<strong>Correct answer:</strong> ตอบ <strong>pencil</strong> ค่ะ! เพราะดินสอเป็นเครื่องเขียนหลักที่เรานำมาใช้ขีดเขียนตัวหนังสือและชื่อลงในสมุดเรียนค่ะ<br><br><strong>Other choices:</strong> chair แปลว่าเก้าอี้เรียน, bag แปลว่ากระเป๋า, และ classroom แปลว่าห้องเรียน ซึ่งไม่มีหน้าที่ในการขีดเขียนหน้ากระดาษค่ะ<br><br><strong>Key concept:</strong> คำศัพท์สิ่งของในห้องเรียน: เรียนรู้การใช้เครื่องมือคู่กับกริยาแสดงอาการ เช่น write (เขียน) จะสัมพันธ์โดยตรงกับ <strong>pencil</strong> (ดินสอ)" },
    { q: "We sit on a _________.", a: "chair", c: ["chair", "desk", "blackboard", "notebook"], speak: "We sit on a...", exp: "<strong>Correct answer:</strong> ตอบ <strong>chair</strong> ค่ะ! เพราะเก้าอี้คือเฟอร์นิเจอร์หลักในห้องเรียนที่จัดเตรียมไว้ให้นักเรียนได้ใช้นั่ง (sit) เพื่อเรียนหนังสือค่ะ<br><br><strong>Other choices:</strong> desk แปลว่าโต๊ะเขียนหนังสือ, blackboard แปลว่ากระดานดำหน้าห้อง, และ notebook แปลว่าสมุดจดบันทึก ซึ่งไม่ได้ใช้นั่งทับค่ะ<br><br><strong>Key concept:</strong> จดจำและแยกแยะคู่คำนามในห้องเรียน: เรานั่งบนเก้าอี้ (<strong>chair</strong>) และขีดเขียนตั้งหนังสือบนโต๊ะเรียน (desk) เสมอค่ะ" },
    { q: "The teacher writes on the _________.", a: "blackboard", c: ["blackboard", "eraser", "book", "pencil"], speak: "The teacher writes on the...", exp: "<strong>Correct answer:</strong> ตอบ <strong>blackboard</strong> ค่ะ! เพราะกระดานดำหน้าห้องเป็นพื้นที่หลักที่คุณครูใช้เขียนแสดงโจทย์ความรู้ให้เด็กๆ มองเห็นร่วมกันค่ะ<br><br><strong>Other choices:</strong> eraser แปลว่ายางลบ, book แปลว่าหนังสือ, และ pencil แปลว่าดินสอ ซึ่งคุณครูไม่สามารถเขียนชอล์กแผ่ลงไปให้เด็กทั้งห้องมองเห็นได้ค่ะ<br><br><strong>Key concept:</strong> คำศัพท์หมวดห้องเรียน: กระดานดำ (<strong>blackboard</strong>) ทำหน้าที่รองรับการเขียนของคุณครูเพื่อให้ผู้เรียนเรียนรู้ร่วมกันพร้อมกัน" },
    { q: "We clean the blackboard with an _________.", a: "eraser", c: ["eraser", "ruler", "pen", "notebook"], speak: "We clean the blackboard with an...", exp: "<strong>Correct answer:</strong> ตอบ <strong>eraser</strong> ค่ะ! เพราะแปรงลบกระดานหรือยางลบถูกนำมาใช้ทำความสะอาดปัดลบรอยปากกาหรือรอยชอล์กบนกระดานดำค่ะ<br><br><strong>Other choices:</strong> ruler แปลว่าไม้บรรทัดวัดระยะ, pen แปลว่าปากกาขีดเส้น, และ notebook แปลว่าสมุดบันทึก ซึ่งไม่ใช่อุปกรณ์ทำความสะอาดกระดาน<br><br><strong>Key concept:</strong> การจับคู่คำศัพท์หน้าที่ของอุปกรณ์: แปรงลบกระดานหรือแปรงลบชอล์กในภาษาอังกฤษมีโครงสร้างคำศัพท์เดียวกับยางลบคือ <strong>eraser</strong> ค่ะ" },
    { q: "We measure straight lines with a _________.", a: "ruler", c: ["ruler", "bag", "pencil", "chair"], speak: "We measure straight lines with a...", exp: "<strong>Correct answer:</strong> ตอบ <strong>ruler</strong> ค่ะ! เพราะไม้บรรทัดเป็นอุปกรณ์การเรียนที่ใช้ขีดนำทางและวัดระยะทางยาว (measure) ของเส้นตรงต่างๆ ค่ะ<br><br><strong>Other choices:</strong> bag แปลว่ากระเป๋าเป้สะพาย, pencil แปลว่าดินสอขีดเขียน, และ chair แปลว่าเก้าอี้ ซึ่งไม่ได้มีคุณสมบัติวัดระยะทางยาวเส้นตรง<br><br><strong>Key concept:</strong> เรียนรู้คำกริยาสำคัญ: คำว่า measure แปลว่า 'วัดระยะ' หรือ 'วัดขนาด' ซึ่งอุปกรณ์ในห้องเรียนที่ใช้ทำหน้าที่วัดระยะคือ <strong>ruler</strong> (ไม้บรรทัด) ค่ะ" },
    { q: "I carry my books in a _________.", a: "school bag", c: ["school bag", "classroom", "eraser", "ruler"], speak: "I carry my books in a...", exp: "<strong>Correct answer:</strong> ตอบ <strong>school bag</strong> ค่ะ! เพราะกระเป๋านักเรียนคือภาชนะที่นำมาใส่และพกพาหนังสือ (carry) เพื่อเดินทางไปเรียนและกลับบ้านอย่างสะดวกสบายค่ะ<br><br><strong>Other choices:</strong> classroom แปลว่าห้องเรียน, eraser แปลว่ายางลบชิ้นเล็ก, และ ruler แปลว่าไม้บรรทัด ซึ่งไม่ใช่อุปกรณ์พกพาหนังสือเป็นเล่มได้ค่ะ<br><br><strong>Key concept:</strong> เรียนรู้อุปกรณ์พกพา: <strong>school bag</strong> (กระเป๋านักเรียน) สอดคล้องโดยตรงกับคำกริยา carry (พกพา/ถือไป) ในหมวดเครื่องเขียน" },
    { q: "We study inside a _________.", a: "classroom", c: ["classroom", "sea", "waffle", "carrot"], speak: "We study inside a...", exp: "<strong>Correct answer:</strong> ตอบ <strong>classroom</strong> ค่ะ! เพราะห้องเรียนคือห้องในอาคารเรียนที่ใช้ศึกษาหาความรู้และทำกิจกรรมร่วมกับเพื่อนๆ และคุณครูค่ะ<br><br><strong>Other choices:</strong> sea แปลว่าทะเลใต้บาดาล, waffle แปลว่าขนมวาฟเฟิลแสนอร่อย, และ carrot แปลว่าหัวแครอท ซึ่งไม่ใช่อาคารสถานที่ศึกษาเล่าเรียนค่ะ<br><br><strong>Key concept:</strong> เรียนรู้คำนามประเภทสถานที่: ห้องสำหรับการเรียนรู้ภายในโรงเรียนของเด็กๆ เรียกว่า <strong>classroom</strong> (ห้องเรียน) เสมอค่ะ" },
    { q: "Who teaches the students at school?", a: "teacher", c: ["teacher", "doctor", "chef", "pilot"], speak: "Who teaches the students at school?", exp: "<strong>Correct answer:</strong> ตอบ <strong>teacher</strong> ค่ะ! เพราะผู้ที่รับผิดชอบวิชาความรู้และอบรมดูแลสั่งสอนเด็กๆ ในระดับโรงเรียนคือ คุณครู (teacher) ค่ะ<br><br><strong>Other choices:</strong> doctor แปลว่าคุณหมอรักษาโรค, chef แปลว่าพ่อครัวทำขนม, และ pilot แปลว่ากัปตันขับเครื่องบินบินสูง ซึ่งไม่ได้สอนที่โรงเรียนค่ะ<br><br><strong>Key concept:</strong> คำศัพท์ด้านวิชาชีพ (Occupations): <strong>teacher</strong> (คุณครู) สอดคล้องโดยตรงกับคำกริยา teach (สอนหนังสือ) ในสถานที่โรงเรียน" },
    { q: "________ your book, page 10.", a: "Open", c: ["Open", "Close", "Eat", "Jump"], speak: "Open your book, page 10.", exp: "<strong>Correct answer:</strong> ตอบ <strong>Open</strong> ค่ะ! เพราะกริยาที่ใช้เพื่อสั่งการให้เด็กๆ กางหรือขยายหน้ากระดาษหนังสือออกเพื่อเรียนรู้คือคำว่า Open (เปิด) ค่ะ<br><br><strong>Other choices:</strong> Close แปลว่าปิดลง, Eat แปลว่ารับประทานกิน, และ Jump แปลว่ากระโดดข้าม ซึ่งนำมารับช่วงหน้ากระดาษในข้อนี้ไม่ได้ค่ะ<br><br><strong>Key concept:</strong> ประโยคคำสั่งในห้องเรียน (Classroom Commands): โครงสร้างประโยค <strong>Open your book</strong> แปลว่าให้เปิดหนังสือเรียนออกหน้าใดๆ ค่ะ" },
    { q: "Please ________ to the teacher.", a: "listen", c: ["listen", "jump", "sleep", "sing"], speak: "Please listen to the teacher.", exp: "<strong>Correct answer:</strong> ตอบ <strong>listen</strong> ค่ะ! เพราะเป็นประโยคขอร้องให้นักเรียนตั้งใจรับฟัง (listen) ข้อมูลที่คุณครูกำลังถ่ายทอดและอธิบายบทเรียนค่ะ<br><br><strong>Other choices:</strong> jump แปลว่ากระโดดโลดเต้น, sleep แปลว่านอนหลับตา, และ sing แปลว่าร้องเพลงดัง ซึ่งขัดแย้งกับการเรียนรู้ในห้องเรียนค่ะ<br><br><strong>Key concept:</strong> คำศัพท์การปฏิสัมพันธ์: คำว่า <strong>listen</strong> (ฟัง) จะตามหลังโครงสร้างคำว่า listen to (ฟังบางคน/บางสิ่ง) เสมอในการแสดงความตั้งใจรับฟัง" },
    { q: "Where do you study? - I study at _________.", a: "school", c: ["school", "home", "hospital", "zoo"], speak: "Where do you study?", exp: "<strong>Correct answer:</strong> ตอบ <strong>school</strong> ค่ะ! เพราะโรงเรียนคือสถาบันหลักที่ผู้เรียนเดินทางมารับวิชาการศึกษา ค้นคว้าความรู้ตามปกติของเด็ก ป.2 ค่ะ<br><br><strong>Other choices:</strong> home แปลว่าบ้านพักผ่อน, hospital แปลว่าโรงพยาบาลคุณหมอรักษาคนไข้, และ zoo แปลว่าสวนสัตว์ชมสัตว์ป่า ซึ่งไม่ใช่สถานที่ศึกษาทั่วไป<br><br><strong>Key concept:</strong> เชื่อมโยงคำถามและตอบสถานที่เรียน: คำนามสถานที่ศึกษาที่ใหญ่และสำคัญที่สุดสำหรับเด็กวัยเรียนคือ <strong>school</strong> (โรงเรียน) ค่ะ" }
  ];
  
  const pool = bookNum === 1 ? book1Questions : book2Questions;
  const shuffled = pool.sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const item = shuffled[i];
    list.push({
      questionText: item.q,
      speakPrompt: item.speak,
      answer: item.a,
      choices: item.c.sort(() => 0.5 - Math.random()),
      explanation: item.exp
    });
  }
  
  while (list.length < count) {
    list.push({
      questionText: "What is this? It is a book.",
      speakPrompt: "What is this? It is a book.",
      answer: "book",
      choices: ["book", "pencil", "ruler", "eraser"],
      explanation: "<strong>Correct answer:</strong> ตอบ <strong>book</strong> ค่ะ! เพราะหนังสือเป็นสิ่งพิมพ์ที่เย็บเล่มเป็นแผ่นๆ ใช้สำหรับอ่านเรียน ภาษาอังกฤษคือ book ค่ะ<br><br><strong>Other choices:</strong> pencil แปลว่าดินสอขีดเขียน, ruler แปลว่าไม้บรรทัดวัดระยะ, และ eraser แปลว่าแปรงลบกระดาน ซึ่งไม่ใช่แผ่นเล่มสำหรับอ่านหนังสือค่ะ<br><br><strong>Key concept:</strong> จดจำคำศัพท์อุปกรณ์การเรียนและเครื่องเขียนชิ้นหลักที่ใช้ในชีวิตประจำวันเพื่อเตรียมเรียนชั้นสูงต่อไปค่ะ"
    });
  }
  return list;
}

// Helper to generate multiple choices (1 correct, 3 distractor)
function generateChoices(correctAnswer, min, max) {
  const choices = new Set([correctAnswer]);
  
  while (choices.size < 4) {
    const offset = Math.floor(Math.random() * 20) - 10; // offset between -10 and 10
    let distractor = correctAnswer + offset;
    
    if (distractor !== correctAnswer && distractor >= min && distractor <= max && offset !== 0) {
      choices.add(distractor);
    }
  }
  
  return Array.from(choices).sort(() => 0.5 - Math.random());
}

// --- DOM NAVIGATION & SCREEN MANAGERS ---
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active-screen');
  });
  
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active-screen');
  }
}

// --- PARTICLE BURST ANIMATION SYSTEM ---
function createParticleBurst(x, y, emojiList = ['✨', '⭐', '🥕', '🍦', '💎', '🎉']) {
  const container = document.body;
  const numParticles = 20;
  
  for (let i = 0; i < numParticles; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.innerText = emojiList[Math.floor(Math.random() * emojiList.length)];
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 80 + 40;
    const dx = Math.cos(angle) * speed;
    const dy = Math.sin(angle) * speed;
    
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--dx', `${dx}px`);
    particle.style.setProperty('--dy', `${dy}px`);
    
    container.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 800);
  }
}

// Undersea bubbles for English page
function setupEnglishBubbles() {
  const bubblesContainer = document.querySelector('.bubbles-bg-english');
  if (bubblesContainer) {
    bubblesContainer.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble-eng';
      
      const size = Math.random() * 18 + 8;
      const left = Math.random() * 95;
      const delay = Math.random() * 6;
      
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${left}%`;
      bubble.style.animationDelay = `${delay}s`;
      
      bubblesContainer.appendChild(bubble);
    }
  }
}

// --- GAME LOGIC ---

function startGame(gameName) {
  state.activeGame = gameName;
  state.score = 0;
  state.currentQuestionIndex = 0;
  state.correctCount = 0;
  
  if (gameName === 'carrot') {
    state.questions = generateCarrotQuestions(state.settings.carrotDifficulty, state.totalQuestions);
    state.bunnyPosition = 0;
    setupCarrotPath();
  } else if (gameName === 'icecream') {
    state.questions = generateIceCreamQuestions(state.settings.icecreamTypes, state.totalQuestions);
    const stack = document.getElementById('icecream-stack');
    stack.querySelectorAll('.scoop').forEach(el => el.remove());
  } else if (gameName === 'geometry') {
    state.questions = generateGeometryQuestions(state.settings.geometryTypes, state.totalQuestions);
    setupGeometryOcean();
  } else if (gameName === 'eng-book1') {
    state.questions = generateEnglishQuestions(1, state.totalQuestions);
    setupEnglishBubbles();
  } else if (gameName === 'eng-book2') {
    state.questions = generateEnglishQuestions(2, state.totalQuestions);
    setupEnglishBubbles();
  }
  
  // Update scores in HUD
  updateHUD();
  
  // Load first question
  loadQuestion();
  
  // Navigate to screen
  if (gameName.startsWith('eng-')) {
    showScreen('game-english');
    const titleText = document.getElementById('english-title-text');
    if (titleText) {
      titleText.innerText = gameName === 'eng-book1' ? '🇬🇧 Book 1: Coral Reef Adventure' : '🇬🇧 Book 2: Undersea School Life';
    }
  } else {
    showScreen(`game-${gameName}`);
  }
}

function updateHUD() {
  const isEng = state.activeGame.startsWith('eng-');
  const gameKey = isEng ? 'english' : state.activeGame;
  const scoreSpan = document.getElementById(`${gameKey}-score`);
  const progressFill = document.getElementById(`${gameKey}-progress`);
  
  if (scoreSpan) scoreSpan.innerText = state.score;
  if (progressFill) {
    const pct = (state.currentQuestionIndex / state.totalQuestions) * 100;
    progressFill.style.width = `${pct}%`;
  }
}

function loadQuestion() {
  if (state.currentQuestionIndex >= state.totalQuestions) {
    endGame();
    return;
  }
  
  const question = state.questions[state.currentQuestionIndex];
  state.currentQuestion = question;
  
  updateHUD();
  
  const isEng = state.activeGame.startsWith('eng-');
  const gameKey = isEng ? 'english' : state.activeGame;
  
  const qTextEl = document.getElementById(`${gameKey}-question`);
  const choicesGrid = document.getElementById(`${gameKey}-choices`);
  
  if (qTextEl) qTextEl.innerText = question.questionText;
  
  if (choicesGrid) {
    choicesGrid.innerHTML = '';
    question.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.innerText = choice;
      btn.addEventListener('click', (e) => handleAnswer(e, choice));
      choicesGrid.appendChild(btn);
    });
  }
  
  if (state.activeGame === 'geometry') {
    const shapeContainer = document.getElementById('geometry-shape-container');
    if (shapeContainer && question.display) {
      shapeContainer.innerHTML = question.display;
    }
    const chest = document.getElementById('treasure-chest');
    chest.className = 'chest-closed';
    chest.innerText = '🧰';
  }
  
  if (autoSpeak) {
    setTimeout(() => {
      const lang = isEng ? 'en-US' : 'th-TH';
      speakText(question.speakPrompt, lang);
    }, 400);
  }
}

function handleAnswer(event, selectedValue) {
  const isEng = state.activeGame.startsWith('eng-');
  const gameKey = isEng ? 'english' : state.activeGame;
  const choicesGrid = document.getElementById(`${gameKey}-choices`);
  
  choicesGrid.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = true;
    if (btn.innerText == state.currentQuestion.answer) {
      btn.classList.add('correct');
    }
  });
  
  const isCorrect = (selectedValue == state.currentQuestion.answer);
  const clickX = event.clientX;
  const clickY = event.clientY;
  
  if (isCorrect) {
    state.score += 10;
    state.correctCount++;
    sounds.playCorrect();
    event.target.classList.add('correct');
    
    createParticleBurst(clickX, clickY, getParticleEmojis());
    triggerGameAnimations(true);
  } else {
    sounds.playWrong();
    event.target.classList.add('wrong');
    triggerGameAnimations(false);
  }
  
  setTimeout(() => {
    showExplanation(isCorrect);
  }, 1000);
}

function showExplanation(isCorrect) {
  const isEng = state.activeGame.startsWith('eng-');
  const overlay = document.getElementById('explanation-overlay');
  const avatar = document.getElementById('explanation-avatar');
  const title = document.getElementById('explanation-title');
  const text = document.getElementById('explanation-text');
  
  if (!overlay || !state.currentQuestion) return;
  
  avatar.innerText = isEng ? '🐠' : '🐱';
  
  if (isCorrect) {
    title.innerText = isEng ? "Correct! Well Done! 🌟" : "เก่งมากค่ะ ตอบถูกต้อง! 🎉";
    title.style.color = '#2e7d32';
  } else {
    title.innerText = isEng ? "Let's review this! 💡" : "ไม่เป็นไรนะ มาเรียนรู้กันค่ะ 💡";
    title.style.color = '#c62828';
  }
  
  text.innerHTML = state.currentQuestion.explanation;
  
  const lang = isEng ? 'en-US' : 'th-TH';
  const speakTextStr = (isCorrect ? (isEng ? "Correct!" : "ถูกต้องแล้วค่ะ! ") : (isEng ? "Let's review." : "มาฟังคำอธิบายกันค่ะ. ")) + 
                       text.innerText.replace(/<[^>]*>/g, '');
  speakText(speakTextStr, lang);
  
  overlay.classList.add('active');
}

function getParticleEmojis() {
  if (state.activeGame === 'carrot') return ['🥕', '✨', '⭐', '🐰'];
  if (state.activeGame === 'icecream') return ['🍦', '✨', '⭐', '🍓', '🍋'];
  if (state.activeGame === 'geometry') return ['💎', '✨', '🪙', '👑', '🐙'];
  if (state.activeGame.startsWith('eng-')) return ['🐟', '✨', '⭐', '🇬🇧', '🐚'];
  return ['✨', '⭐', '🎉'];
}

function triggerGameAnimations(isCorrect) {
  if (state.activeGame === 'carrot') {
    if (isCorrect) {
      state.bunnyPosition++;
      sounds.playJump();
      animateBunnyHop(state.bunnyPosition);
    }
  } else if (state.activeGame === 'icecream') {
    if (isCorrect) {
      sounds.playScoop();
      addIceCreamScoop();
    }
  } else if (state.activeGame === 'geometry') {
    if (isCorrect) {
      sounds.playChestOpen();
      const chest = document.getElementById('treasure-chest');
      chest.innerText = '🔓';
      chest.classList.add('chest-open-animation');
      
      const chestRect = chest.getBoundingClientRect();
      setTimeout(() => {
        createParticleBurst(chestRect.left + chestRect.width / 2, chestRect.top + chestRect.height / 2, ['🪙', '✨', '💎', '👑']);
      }, 200);
    }
  } else if (state.activeGame.startsWith('eng-')) {
    if (isCorrect) {
      const Nemo = document.querySelector('.clownfish-swim');
      const Dory = document.querySelector('.blue-tang-swim');
      if (Nemo) Nemo.style.animationDuration = '4s';
      if (Dory) Dory.style.animationDuration = '5s';
      
      setTimeout(() => {
        if (Nemo) Nemo.style.animationDuration = '18s';
        if (Dory) Dory.style.animationDuration = '24s';
      }, 2000);
    }
  }
}

// Carrot Game Path rendering
function setupCarrotPath() {
  const path = document.getElementById('carrot-path');
  path.innerHTML = '';
  
  for (let i = 0; i < state.totalQuestions; i++) {
    const block = document.createElement('div');
    block.className = 'path-block';
    block.id = `carrot-block-${i}`;
    block.innerText = i + 1;
    
    if (i === state.totalQuestions - 1) {
      const carrot = document.createElement('span');
      carrot.className = 'carrot-reward';
      carrot.innerText = '🥕';
      block.appendChild(carrot);
    }
    
    path.appendChild(block);
  }
  
  setTimeout(() => {
    animateBunnyHop(0);
  }, 100);
}

function animateBunnyHop(blockIndex) {
  const bunny = document.getElementById('bunny');
  const targetBlock = document.getElementById(`carrot-block-${Math.min(blockIndex, 9)}`);
  
  if (bunny && targetBlock) {
    bunny.classList.add('bunny-jump');
    
    const playfield = document.querySelector('.carrot-playfield');
    const pfRect = playfield.getBoundingClientRect();
    const bRect = targetBlock.getBoundingClientRect();
    
    const leftOffset = bRect.left - pfRect.left + (bRect.width / 2) - 40;
    bunny.style.left = `${leftOffset}px`;
    
    for (let i = 0; i < 10; i++) {
      const b = document.getElementById(`carrot-block-${i}`);
      if (b) {
        if (i < blockIndex) {
          b.className = 'path-block visited';
        } else if (i === blockIndex) {
          b.className = 'path-block active';
        } else {
          b.className = 'path-block';
        }
      }
    }
    
    setTimeout(() => {
      bunny.classList.remove('bunny-jump');
    }, 600);
  }
}

function addIceCreamScoop() {
  const stack = document.getElementById('icecream-stack');
  const scoop = document.createElement('div');
  
  const flavors = ['strawberry', 'mint', 'vanilla', 'bubblegum', 'chocolate'];
  const randomFlavor = flavors[Math.floor(Math.random() * flavors.length)];
  
  scoop.className = `scoop flavor-${randomFlavor}`;
  stack.appendChild(scoop);
}

function setupGeometryOcean() {
  const bubblesContainer = document.querySelector('.bubbles-bg');
  if (bubblesContainer) {
    bubblesContainer.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      
      const size = Math.random() * 20 + 8;
      const left = Math.random() * 95;
      const delay = Math.random() * 5;
      
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${left}%`;
      bubble.style.animationDelay = `${delay}s`;
      
      bubblesContainer.appendChild(bubble);
    }
  }
}

function endGame() {
  sounds.playVictory();
  
  const titleSpan = document.getElementById('summary-game-name');
  const scoreSpan = document.getElementById('summary-score');
  const correctSpan = document.getElementById('summary-correct');
  const totalSpan = document.getElementById('summary-total');
  
  let gameTitle = 'ตะลุยป่าแครอท';
  if (state.activeGame === 'icecream') gameTitle = 'ร้านไอศกรีมพ่อมด';
  if (state.activeGame === 'geometry') gameTitle = 'ล่าสมบัติใต้ทะเล';
  if (state.activeGame === 'eng-book1') gameTitle = 'Coral Reef Adventure (เล่ม 1)';
  if (state.activeGame === 'eng-book2') gameTitle = 'Undersea School Life (เล่ม 2)';
  
  if (titleSpan) titleSpan.innerText = gameTitle;
  if (scoreSpan) scoreSpan.innerText = state.score;
  if (correctSpan) correctSpan.innerText = state.correctCount;
  if (totalSpan) totalSpan.innerText = state.totalQuestions;
  
  const stars = document.querySelectorAll('#victory-stars .star-rating');
  let numStars = 0;
  if (state.correctCount >= 9) numStars = 3;
  else if (state.correctCount >= 6) numStars = 2;
  else if (state.correctCount >= 3) numStars = 1;
  
  stars.forEach((star, idx) => {
    star.classList.remove('active');
    if (idx < numStars) {
      setTimeout(() => {
        star.classList.add('active');
      }, (idx + 1) * 300);
    }
  });
  
  const dateSpan = document.getElementById('cert-current-date');
  if (dateSpan) {
    const today = new Date();
    dateSpan.innerText = today.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  setTimeout(() => {
    if (state.activeGame.startsWith('eng-')) {
      speakText(`Congratulations Namfah! You passed ${gameTitle} with ${state.score} points! Well done!`, 'en-US');
    } else {
      speakText(`เก่งมากเลยค่ะ! เพื่อนๆ ผ่านด่าน ${gameTitle} แล้ว ได้คะแนน ${state.score} คะแนน รับรางวัลไปเลย!`);
    }
  }, 100);
  
  showScreen('victory-screen');
}

// --- CONTEXT & SETTINGS CONTROLLERS ---

function loadSettingsForm() {
  // 1. Carrot difficulty
  document.querySelectorAll('input[name="carrot-difficulty"]').forEach(input => {
    if (input.value === state.settings.carrotDifficulty) input.checked = true;
  });
  
  // 2. Ice cream types
  document.querySelectorAll('input[name="icecream-types"]').forEach(input => {
    input.checked = state.settings.icecreamTypes.includes(input.value);
  });
  
  // 3. Geometry types (ocean)
  document.querySelectorAll('input[name="geometry-types"]').forEach(input => {
    input.checked = state.settings.geometryTypes.includes(input.value);
  });
  
  // 4. Auto speak
  document.getElementById('setting-auto-speak').checked = autoSpeak;
}

function saveSettingsForm() {
  // 1. Carrot difficulty
  const activeDiff = document.querySelector('input[name="carrot-difficulty"]:checked');
  if (activeDiff) state.settings.carrotDifficulty = activeDiff.value;
  
  // 2. Ice cream types
  const selectedIcecream = [];
  document.querySelectorAll('input[name="icecream-types"]:checked').forEach(input => {
    selectedIcecream.push(input.value);
  });
  if (selectedIcecream.length > 0) {
    state.settings.icecreamTypes = selectedIcecream;
  }
  
  // 3. Geometry types
  const selectedGeometry = [];
  document.querySelectorAll('input[name="geometry-types"]:checked').forEach(input => {
    selectedGeometry.push(input.value);
  });
  if (selectedGeometry.length > 0) {
    state.settings.geometryTypes = selectedGeometry;
  }
  
  // 4. Auto speak
  autoSpeak = document.getElementById('setting-auto-speak').checked;
  
  // Close modal
  document.getElementById('settings-modal').classList.remove('active');
}


// --- INITIALIZATION & BINDINGS ---
document.addEventListener('DOMContentLoaded', () => {
  // Generate floating bubbles for homepage
  const homeBubbles = document.querySelector('.bubbles-bg-home');
  if (homeBubbles) {
    homeBubbles.innerHTML = '';
    for (let i = 0; i < 15; i++) {
      const bubble = document.createElement('div');
      bubble.className = 'bubble-home';
      const size = Math.random() * 22 + 8;
      const left = Math.random() * 95;
      const delay = Math.random() * 7;
      const duration = Math.random() * 5 + 6;
      
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${left}%`;
      bubble.style.animationDelay = `${delay}s`;
      bubble.style.animationDuration = `${duration}s`;
      homeBubbles.appendChild(bubble);
    }
  }

  // 1. Start Game trigger - now goes to Subject Selector
  document.getElementById('btn-start-game').addEventListener('click', () => {
    sounds.init();
    showScreen('subject-menu');
    setTimeout(() => {
      speakText('สวัสดีค่ะ น้องน้ำฟ้า ยินดีต้อนรับเข้าเรียนค่ะ วันนี้อยากทบทวนวิชาอะไรดีคะ คณิต หรือ อังกฤษดีเอ่ย', 'th-TH');
    }, 200);
  });
  
  // Subject Menu clicks
  document.getElementById('btn-select-math').addEventListener('click', () => {
    sounds.init();
    showScreen('main-menu');
    setTimeout(() => {
      speakText('มาทบทวนคณิตศาสตร์แสนสนุกกันเลยค่ะน้ำฟ้า!', 'th-TH');
    }, 200);
  });
  
  document.getElementById('btn-select-english').addEventListener('click', () => {
    sounds.init();
    showScreen('english-menu');
    setTimeout(() => {
      speakText("Let's review English under the sea!", 'en-US');
    }, 200);
  });
  
  document.getElementById('btn-select-maze').addEventListener('click', () => {
    sounds.init();
    speakText('ไปผจญภัยในเขาวงกตแสนสนุกกันเลยค่ะน้ำฟ้า!', 'th-TH');
    setTimeout(() => {
      window.location.href = 'maze.html';
    }, 1000);
  });
  
  document.querySelectorAll('.btn-back-subject').forEach(btn => {
    btn.addEventListener('click', () => {
      showScreen('subject-menu');
      window.speechSynthesis.cancel();
    });
  });
  
  document.querySelectorAll('.btn-back-english').forEach(btn => {
    btn.addEventListener('click', () => {
      showScreen('english-menu');
      window.speechSynthesis.cancel();
    });
  });
  
  // 2. Math Dashboard level clicks
  document.querySelectorAll('#main-menu .game-card').forEach(card => {
    const playBtn = card.querySelector('.btn-play');
    const playAction = () => {
      sounds.init();
      startGame(card.getAttribute('data-game'));
    };
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') playAction();
    });
    playBtn.addEventListener('click', playAction);
  });
  
  // 3. English Dashboard level clicks
  document.querySelectorAll('#english-menu .game-card').forEach(card => {
    const playBtn = card.querySelector('.btn-play');
    const playAction = () => {
      sounds.init();
      startGame(card.getAttribute('data-game'));
    };
    card.addEventListener('click', (e) => {
      if (e.target.tagName !== 'BUTTON') playAction();
    });
    playBtn.addEventListener('click', playAction);
  });
  
  // 4. Back to math dashboard buttons
  document.querySelectorAll('#game-carrot .btn-back, #game-icecream .btn-back, #game-geometry .btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      showScreen('main-menu');
      window.speechSynthesis.cancel();
    });
  });
  
  // 5. Victory Screen buttons
  document.getElementById('btn-victory-home').addEventListener('click', () => {
    if (state.activeGame.startsWith('eng-')) {
      showScreen('english-menu');
    } else {
      showScreen('main-menu');
    }
  });
  
  document.getElementById('btn-print-certificate').addEventListener('click', () => {
    window.print();
  });
  
  // 6. Settings Modal bindings
  const settingsModal = document.getElementById('settings-modal');
  
  document.getElementById('btn-open-settings').addEventListener('click', () => {
    loadSettingsForm();
    settingsModal.classList.add('active');
  });
  
  document.getElementById('btn-open-settings-english').addEventListener('click', () => {
    loadSettingsForm();
    settingsModal.classList.add('active');
  });
  
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });
  
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    saveSettingsForm();
  });
  
  window.addEventListener('click', (e) => {
    if (e.target == settingsModal) {
      settingsModal.classList.remove('active');
    }
  });
  
  // 7. Sound & TTS Quick Toggles
  const soundToggles = ['btn-toggle-sound', 'btn-toggle-sound-english'];
  soundToggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        sounds.muted = !sounds.muted;
        soundToggles.forEach(tId => {
          const tEl = document.getElementById(tId);
          if (tEl) {
            tEl.innerText = sounds.muted ? '🔇' : '🔊';
            tEl.title = sounds.muted ? 'เปิดเสียง' : 'ปิดเสียง';
          }
        });
        if (!sounds.muted) {
          sounds.init();
          sounds.playTone(440, 0.05, 0.1, 'sine');
        }
      });
    }
  });
  
  const speechToggles = ['btn-toggle-speech', 'btn-toggle-speech-english'];
  speechToggles.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', () => {
        ttsEnabled = !ttsEnabled;
        speechToggles.forEach(tId => {
          const tEl = document.getElementById(tId);
          if (tEl) {
            tEl.innerText = ttsEnabled ? '🗣️' : '🔇🗣️';
            tEl.title = ttsEnabled ? 'ปิดเสียงอ่านโจทย์' : 'เปิดเสียงอ่านโจทย์';
          }
        });
        if (ttsEnabled) {
          speakText('เปิดตัวควบคุมการออกเสียงเรียบร้อยค่ะ', 'th-TH');
        } else {
          window.speechSynthesis.cancel();
        }
      });
    }
  });
  
  // 8. Voice helper clicks
  document.getElementById('btn-speak-carrot').addEventListener('click', () => {
    if (state.currentQuestion) speakText(state.currentQuestion.speakPrompt, 'th-TH');
  });
  
  document.getElementById('btn-speak-icecream').addEventListener('click', () => {
    if (state.currentQuestion) speakText(state.currentQuestion.speakPrompt, 'th-TH');
  });
  
  document.getElementById('btn-speak-geometry').addEventListener('click', () => {
    if (state.currentQuestion) speakText(state.currentQuestion.speakPrompt, 'th-TH');
  });
  
  document.getElementById('btn-speak-english').addEventListener('click', () => {
    if (state.currentQuestion) speakText(state.currentQuestion.speakPrompt, 'en-US');
  });

  // 9. Explanation Next button
  const nextBtn = document.getElementById('btn-next-question');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      document.getElementById('explanation-overlay').classList.remove('active');
      window.speechSynthesis.cancel();
      
      state.currentQuestionIndex++;
      loadQuestion();
    });
  }
});
