import { Certificate, ExamResult } from '../types';
import { generateId } from '../utilities/id-generator';
import { GradingEngine } from '../grading/GradingEngine';
import { ExamBuilder } from '../exam-builder/ExamBuilder';

export interface CertificateTemplate {
  id: string;
  name: string;
  render: (data: CertificateData) => string;
}

export interface CertificateData {
  participantId: string;
  examTitle: string;
  score: number;
  passed: boolean;
  issuedAt: Date;
  expiresAt?: Date;
  verificationCode: string;
}

export class CertificateGenerator {
  private certificates: Map<string, Certificate>;
  private templates: Map<string, CertificateTemplate>;
  private gradingEngine: GradingEngine;
  private examBuilder: ExamBuilder;

  constructor(gradingEngine: GradingEngine, examBuilder: ExamBuilder) {
    this.certificates = new Map();
    this.templates = new Map();
    this.gradingEngine = gradingEngine;
    this.examBuilder = examBuilder;
    this.registerDefaultTemplate();
  }

  registerTemplate(template: CertificateTemplate): void {
    this.templates.set(template.id, template);
  }

  registerTemplates(templates: CertificateTemplate[]): void {
    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }

  generate(
    participantId: string,
    examId: string,
    resultId: string,
    templateId?: string,
  ): Certificate | undefined {
    const result = this.gradingEngine.getAllResults().find((r) => r.id === resultId);
    if (!result || !result.passed) return undefined;

    const exam = this.examBuilder.get(examId);
    if (!exam) return undefined;

    const verificationCode = this.generateVerificationCode();

    const certificate: Certificate = {
      id: generateId('cert'),
      participantId,
      examId,
      resultId,
      title: exam.title,
      issuedAt: new Date(),
      verificationCode,
      metadata: {
        templateId: templateId ?? 'default',
      },
    };

    this.certificates.set(certificate.id, certificate);
    return certificate;
  }

  generateBatch(results: ExamResult[]): Certificate[] {
    const certificates: Certificate[] = [];
    for (const result of results) {
      if (!result.passed) continue;
      const cert = this.generate(result.participantId, result.examId, result.id);
      if (cert) certificates.push(cert);
    }
    return certificates;
  }

  render(id: string, templateId = 'default'): string | undefined {
    const certificate = this.certificates.get(id);
    if (!certificate) return undefined;

    const exam = this.examBuilder.get(certificate.examId);
    const result = this.gradingEngine.getAllResults().find((r) => r.id === certificate.resultId);
    if (!exam || !result) return undefined;

    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    const data: CertificateData = {
      participantId: certificate.participantId,
      examTitle: certificate.title,
      score: result.percentage,
      passed: result.passed,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
      verificationCode: certificate.verificationCode,
    };

    return template.render(data);
  }

  verify(verificationCode: string): Certificate | undefined {
    return Array.from(this.certificates.values()).find(
      (c) => c.verificationCode === verificationCode,
    );
  }

  get(id: string): Certificate | undefined {
    return this.certificates.get(id);
  }

  getByParticipant(participantId: string): Certificate[] {
    return Array.from(this.certificates.values()).filter((c) => c.participantId === participantId);
  }

  getByExam(examId: string): Certificate[] {
    return Array.from(this.certificates.values()).filter((c) => c.examId === examId);
  }

  getAll(): Certificate[] {
    return Array.from(this.certificates.values());
  }

  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private registerDefaultTemplate(): void {
    this.templates.set('default', {
      id: 'default',
      name: 'Default Certificate',
      render: (data: CertificateData) => {
        return [
          '========================================',
          '          CERTIFICATE OF COMPLETION     ',
          '========================================',
          '',
          `  Participant: ${data.participantId}`,
          `  Exam: ${data.examTitle}`,
          `  Score: ${data.score}%`,
          `  Status: ${data.passed ? 'PASSED' : 'FAILED'}`,
          `  Issued: ${data.issuedAt.toISOString()}`,
          '',
          `  Verification Code: ${data.verificationCode}`,
          '',
          '========================================',
          '  Verify at: https://casuya/verify       ',
          '========================================',
        ].join('\n');
      },
    });
  }

  clear(): void {
    this.certificates.clear();
  }

  get size(): number {
    return this.certificates.size;
  }
}
