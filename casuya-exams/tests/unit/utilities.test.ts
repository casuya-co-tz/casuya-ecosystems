import {
  validateQuestion,
  validateExam,
  validateSchedule,
  validateAnswer,
  isObjectiveType,
  isSubjectiveType,
} from '../../src/utilities/validators';
import { shuffle } from '../../src/utilities/shuffle';
import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculatePercentile,
  calculatePassRate,
} from '../../src/utilities/statistics';
import { generateId } from '../../src/utilities/id-generator';

describe('Validators', () => {
  it('should validate questions', () => {
    const errors = validateQuestion({ title: '', body: '' });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass valid questions', () => {
    const errors = validateQuestion({
      title: 'Test',
      body: 'Body',
      type: 'multiple-choice',
      points: 10,
      categoryId: 'cat-1',
      options: [{ id: 'a', text: 'A', isCorrect: true, order: 0 }],
    });
    expect(errors.length).toBe(0);
  });

  it('should validate exams', () => {
    const errors = validateExam({ title: '', passingScore: -1 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should pass valid exams', () => {
    const errors = validateExam({
      title: 'Test',
      passingScore: 50,
      timeLimit: 30,
      maxAttempts: 2,
    });
    expect(errors.length).toBe(0);
  });

  it('should validate schedules', () => {
    const errors = validateSchedule({
      startTime: new Date('2025-01-02'),
      endTime: new Date('2025-01-01'),
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should validate answers', () => {
    const errors = validateAnswer({});
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should detect question types', () => {
    expect(isObjectiveType('multiple-choice')).toBe(true);
    expect(isObjectiveType('true-false')).toBe(true);
    expect(isObjectiveType('essay')).toBe(false);
    expect(isSubjectiveType('essay')).toBe(true);
    expect(isSubjectiveType('short-answer')).toBe(true);
    expect(isSubjectiveType('multiple-choice')).toBe(false);
  });
});

describe('Shuffle', () => {
  it('should return array of same length', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled.length).toBe(arr.length);
  });

  it('should contain all original elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('should not mutate original', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffle(arr);
    expect(arr).toEqual(copy);
  });
});

describe('Statistics', () => {
  it('should calculate mean', () => {
    expect(calculateMean([1, 2, 3, 4, 5])).toBe(3);
    expect(calculateMean([])).toBe(0);
  });

  it('should calculate median', () => {
    expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3);
    expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
    expect(calculateMedian([])).toBe(0);
  });

  it('should calculate standard deviation', () => {
    const std = calculateStandardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(std).toBeCloseTo(2, 0);
    expect(calculateStandardDeviation([])).toBe(0);
  });

  it('should calculate percentiles', () => {
    expect(calculatePercentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(calculatePercentile([], 50)).toBe(0);
  });

  it('should calculate pass rate', () => {
    expect(calculatePassRate([30, 50, 70, 90], 50)).toBe(75);
    expect(calculatePassRate([], 50)).toBe(0);
  });
});

describe('IdGenerator', () => {
  it('should generate unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId());
    }
    expect(ids.size).toBe(100);
  });

  it('should use prefix', () => {
    const id = generateId('q');
    expect(id.startsWith('q_')).toBe(true);
  });
});
