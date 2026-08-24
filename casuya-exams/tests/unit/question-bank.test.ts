import { QuestionManager } from '../../src/question-bank/questions/QuestionManager';
import { CategoryManager } from '../../src/question-bank/categories/CategoryManager';
import { TagManager } from '../../src/question-bank/tags/TagManager';
import { DifficultyManager } from '../../src/question-bank/difficulty/DifficultyManager';
import { QuestionCategory, DifficultyLevel } from '../../src/types';

describe('TagManager', () => {
  let tagManager: TagManager;

  beforeEach(() => {
    tagManager = new TagManager();
  });

  it('should create a tag', () => {
    const tag = tagManager.create('Algebra');
    expect(tag.name).toBe('algebra');
    expect(tag.id).toBeTruthy();
  });

  it('should normalize tag names', () => {
    const tag1 = tagManager.create('Algebra');
    const tag2 = tagManager.create('ALGEBRA');
    expect(tag1.id).toBe(tag2.id);
  });

  it('should find tag by name', () => {
    tagManager.create('Geometry');
    const found = tagManager.findByName('geometry');
    expect(found).toBeDefined();
    expect(found?.name).toBe('geometry');
  });

  it('should suggest tags', () => {
    tagManager.create('Algebra');
    tagManager.create('Geometry');
    tagManager.create('Calculus');
    const suggestions = tagManager.suggest('geom');
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].name).toBe('geometry');
  });

  it('should track usage', () => {
    const tag = tagManager.create('Physics');
    tagManager.incrementUsage(tag.id);
    tagManager.incrementUsage(tag.id);
    expect(tagManager.getUsageCount(tag.id)).toBe(2);
    tagManager.decrementUsage(tag.id);
    expect(tagManager.getUsageCount(tag.id)).toBe(1);
  });
});

describe('CategoryManager', () => {
  let categoryManager: CategoryManager;

  beforeEach(() => {
    categoryManager = new CategoryManager();
  });

  it('should create a category', () => {
    const cat = categoryManager.create({
      name: 'Mathematics',
      description: 'Math questions',
    });
    expect(cat.id).toBeTruthy();
    expect(cat.name).toBe('Mathematics');
  });

  it('should create hierarchical categories', () => {
    const parent = categoryManager.create({ name: 'Science', description: '' });
    const child = categoryManager.create({
      name: 'Physics',
      description: '',
      parentId: parent.id,
    });
    const children = categoryManager.getChildren(parent.id);
    expect(children.length).toBe(1);
    expect(children[0].id).toBe(child.id);
  });

  it('should get root categories', () => {
    categoryManager.create({ name: 'Math', description: '' });
    categoryManager.create({ name: 'Science', description: '' });
    categoryManager.create({
      name: 'Physics',
      description: '',
      parentId: 'some-id',
    });
    const roots = categoryManager.getRootCategories();
    expect(roots.length).toBe(2);
  });

  it('should update a category', () => {
    const cat = categoryManager.create({ name: 'Old', description: '' });
    const updated = categoryManager.update(cat.id, { name: 'New' });
    expect(updated?.name).toBe('New');
    expect(updated?.id).toBe(cat.id);
  });

  it('should delete a category', () => {
    const cat = categoryManager.create({ name: 'Temp', description: '' });
    expect(categoryManager.delete(cat.id)).toBe(true);
    expect(categoryManager.get(cat.id)).toBeUndefined();
  });

  it('should get path to root', () => {
    const grandparent = categoryManager.create({ name: 'Education', description: '' });
    const parent = categoryManager.create({
      name: 'Science',
      description: '',
      parentId: grandparent.id,
    });
    const child = categoryManager.create({
      name: 'Physics',
      description: '',
      parentId: parent.id,
    });
    const path = categoryManager.getPath(child.id);
    expect(path.length).toBe(3);
    expect(path[0].name).toBe('Education');
    expect(path[2].name).toBe('Physics');
  });
});

describe('DifficultyManager', () => {
  let difficultyManager: DifficultyManager;

  beforeEach(() => {
    difficultyManager = new DifficultyManager();
  });

  it('should have default difficulties', () => {
    const configs = difficultyManager.getAllConfigs();
    expect(configs.length).toBe(4);
  });

  it('should get config by level', () => {
    const config = difficultyManager.getConfig('easy');
    expect(config).toBeDefined();
    expect(config?.weight).toBe(1);
  });

  it('should calculate difficulty from stats', () => {
    expect(difficultyManager.calculateDifficultyFromStats(0.9)).toBe('easy');
    expect(difficultyManager.calculateDifficultyFromStats(0.7)).toBe('medium');
    expect(difficultyManager.calculateDifficultyFromStats(0.5)).toBe('hard');
    expect(difficultyManager.calculateDifficultyFromStats(0.3)).toBe('very-hard');
  });

  it('should register custom difficulties', () => {
    difficultyManager.registerDifficulty({
      level: 'easy' as DifficultyLevel,
      label: 'Trivial',
      color: '#fff',
      weight: 0.5,
      description: 'Trivial questions',
    });
    const config = difficultyManager.getConfig('easy');
    expect(config?.label).toBe('Trivial');
  });

  it('should compute difficulty distribution', () => {
    const distribution = difficultyManager.getDifficultyDistribution([
      'easy',
      'easy',
      'medium',
      'hard',
      'very-hard',
    ]);
    expect(distribution.easy).toBe(2);
    expect(distribution.medium).toBe(1);
    expect(distribution.hard).toBe(1);
    expect(distribution['very-hard']).toBe(1);
  });
});

describe('QuestionManager', () => {
  let questionManager: QuestionManager;
  let tagManager: TagManager;
  let categoryManager: CategoryManager;
  let category: QuestionCategory;

  beforeEach(() => {
    tagManager = new TagManager();
    categoryManager = new CategoryManager();
    questionManager = new QuestionManager(tagManager);
    category = categoryManager.create({ name: 'Math', description: '' });
  });

  it('should create a question', () => {
    const question = questionManager.create({
      type: 'multiple-choice',
      title: 'What is 2+2?',
      body: 'Choose the correct answer',
      options: [
        { id: 'a', text: '3', isCorrect: false, order: 0 },
        { id: 'b', text: '4', isCorrect: true, order: 1 },
        { id: 'c', text: '5', isCorrect: false, order: 2 },
      ],
      points: 1,
      difficulty: 'easy',
      categoryId: category.id,
      tags: [],
      metadata: {},
    });
    expect(question.id).toBeTruthy();
    expect(question.version).toBe(1);
    expect(question.title).toBe('What is 2+2?');
  });

  it('should validate on create', () => {
    expect(() => {
      questionManager.create({
        type: 'multiple-choice',
        title: '',
        body: '',
        points: 1,
        difficulty: 'easy',
        categoryId: '',
        tags: [],
        metadata: {},
      });
    }).toThrow('Validation failed');
  });

  it('should update a question', () => {
    const q = questionManager.create({
      type: 'single-choice',
      title: 'Original',
      body: 'Body',
      options: [{ id: 'a', text: 'Yes', isCorrect: true, order: 0 }],
      points: 1,
      difficulty: 'easy',
      categoryId: category.id,
      tags: [],
      metadata: {},
    });
    const updated = questionManager.update(q.id, { title: 'Updated' });
    expect(updated?.title).toBe('Updated');
    expect(updated?.version).toBe(2);
  });

  it('should delete a question', () => {
    const q = questionManager.create({
      type: 'essay',
      title: 'Test',
      body: 'Body',
      points: 1,
      difficulty: 'easy',
      categoryId: category.id,
      tags: [],
      metadata: {},
    });
    expect(questionManager.delete(q.id)).toBe(true);
    expect(questionManager.get(q.id)).toBeUndefined();
  });

  it('should filter questions', () => {
    questionManager.create({
      type: 'multiple-choice',
      title: 'Math Q1',
      body: 'Body',
      options: [{ id: 'a', text: 'A', isCorrect: true, order: 0 }],
      points: 1,
      difficulty: 'easy',
      categoryId: category.id,
      tags: [],
      metadata: {},
    });
    questionManager.create({
      type: 'essay',
      title: 'Essay Q',
      body: 'Write an essay',
      points: 10,
      difficulty: 'hard',
      categoryId: category.id,
      tags: [],
      metadata: {},
    });

    const result = questionManager.filter({ type: 'essay' });
    expect(result.items.length).toBe(1);
    expect(result.total).toBe(1);
  });

  it('should get random questions', () => {
    for (let i = 0; i < 10; i++) {
      questionManager.create({
        type: 'multiple-choice',
        title: `Q${i}`,
        body: 'Body',
        options: [{ id: 'a', text: 'A', isCorrect: true, order: 0 }],
        points: 1,
        difficulty: 'easy',
        categoryId: category.id,
        tags: [],
        metadata: {},
      });
    }
    const random = questionManager.getRandom(3);
    expect(random.length).toBe(3);
  });
});
