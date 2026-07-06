const {
  generateChoices,
  generateCarrotQuestions,
  generateIceCreamQuestions,
  generateGeometryQuestions,
  generateEnglishQuestions,
  logVisit
} = require('./script.js');

describe('script.js utility functions', () => {
  test('generateChoices returns 4 unique choices including the correct answer', () => {
    const result = generateChoices(42, 0, 100);
    expect(result).toHaveLength(4);
    expect(new Set(result).size).toBe(4);
    expect(result).toContain(42);
    result.forEach(choice => {
      expect(choice).toBeGreaterThanOrEqual(0);
      expect(choice).toBeLessThanOrEqual(100);
    });
  });

  test('generateCarrotQuestions returns the expected count and valid structure', () => {
    const questions = generateCarrotQuestions('easy', 5);
    expect(questions).toHaveLength(5);
    questions.forEach(question => {
      expect(question).toHaveProperty('questionText');
      expect(question).toHaveProperty('speakPrompt');
      expect(question).toHaveProperty('answer');
      expect(question).toHaveProperty('choices');
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(question.answer);
    });
  });

  test('generateIceCreamQuestions returns questions for place-value type', () => {
    const questions = generateIceCreamQuestions(['place-value'], 4);
    expect(questions).toHaveLength(4);
    questions.forEach(question => {
      expect(question).toHaveProperty('questionText');
      expect(question).toHaveProperty('answer');
      expect(Array.isArray(question.choices)).toBe(true);
      expect(question.choices).toContain(question.answer);
    });
  });

  test('generateGeometryQuestions returns comparison or pattern questions', () => {
    const questions = generateGeometryQuestions(['compare', 'pattern'], 3);
    expect(questions).toHaveLength(3);
    questions.forEach(question => {
      expect(question).toHaveProperty('questionText');
      expect(question).toHaveProperty('answer');
      expect(Array.isArray(question.choices)).toBe(true);
      expect(question.choices).toContain(question.answer);
    });
  });

  test('generateEnglishQuestions returns expected number of question objects', () => {
    const questions = generateEnglishQuestions(1, 5);
    expect(questions).toHaveLength(5);
    questions.forEach(question => {
      expect(question).toHaveProperty('questionText');
      expect(question).toHaveProperty('answer');
      expect(question.choices).toHaveLength(4);
      expect(question.choices).toContain(question.answer);
    });
  });

  test('logVisit stores a visit entry in localStorage', () => {
    localStorage.clear();
    logVisit();
    const log = JSON.parse(localStorage.getItem('nn_visit_log') || '[]');
    expect(Array.isArray(log)).toBe(true);
    expect(log.length).toBe(1);
    expect(log[0]).toHaveProperty('date');
    expect(log[0]).toHaveProperty('time');
  });
});
