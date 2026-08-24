import { Question, Exam, ExamSchedule, Answer, QuestionType } from '../types';

export function validateQuestion(question: Partial<Question>): string[] {
  const errors: string[] = [];

  if (!question.title || question.title.trim().length === 0) {
    errors.push('Question title is required');
  }
  if (!question.body || question.body.trim().length === 0) {
    errors.push('Question body is required');
  }
  if (!question.type) {
    errors.push('Question type is required');
  }
  if (question.points !== undefined && question.points < 0) {
    errors.push('Points must be non-negative');
  }
  if (!question.categoryId) {
    errors.push('Category is required');
  }

  if (question.type && isObjectiveType(question.type) && !question.options?.length) {
    errors.push('Objective questions must have options');
  }

  return errors;
}

export function validateExam(exam: Partial<Exam>): string[] {
  const errors: string[] = [];

  if (!exam.title || exam.title.trim().length === 0) {
    errors.push('Exam title is required');
  }
  if (exam.passingScore !== undefined && (exam.passingScore < 0 || exam.passingScore > 100)) {
    errors.push('Passing score must be between 0 and 100');
  }
  if (exam.timeLimit !== undefined && exam.timeLimit < 1) {
    errors.push('Time limit must be at least 1 minute');
  }
  if (exam.maxAttempts !== undefined && exam.maxAttempts < 1) {
    errors.push('Max attempts must be at least 1');
  }

  return errors;
}

export function validateSchedule(schedule: Partial<ExamSchedule>): string[] {
  const errors: string[] = [];

  if (!schedule.examId) {
    errors.push('Exam ID is required');
  }
  if (!schedule.startTime) {
    errors.push('Start time is required');
  }
  if (!schedule.endTime) {
    errors.push('End time is required');
  }
  if (schedule.startTime && schedule.endTime && schedule.startTime >= schedule.endTime) {
    errors.push('End time must be after start time');
  }

  return errors;
}

export function validateAnswer(answer: Partial<Answer>): string[] {
  const errors: string[] = [];

  if (!answer.questionId) {
    errors.push('Question ID is required');
  }
  if (answer.value === undefined || answer.value === null) {
    errors.push('Answer value is required');
  }

  return errors;
}

export function isObjectiveType(type: QuestionType): boolean {
  return ['multiple-choice', 'single-choice', 'true-false', 'matching', 'ordering'].includes(type);
}

export function isSubjectiveType(type: QuestionType): boolean {
  return ['short-answer', 'essay', 'fill-blank'].includes(type);
}
