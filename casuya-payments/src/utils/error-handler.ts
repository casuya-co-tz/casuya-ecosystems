import { IErrorHandler, IConfigService } from '../interfaces';

export class ErrorHandler implements IErrorHandler {
  private errors: Error[] = [];

  handle(error: Error): void {
    this.errors.push(error);
    console.error(`[ERROR HANDLER] ${new Date().toISOString()}:`, error.message || error);
  }

  getErrors(): Error[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }
}

export class ConfigService implements IConfigService {
  private config: Record<string, any> = {};

  get<T>(key: string): T {
    return this.config[key];
  }

  set<T>(key: string, value: T): void {
    this.config[key] = value;
  }

  getAll(): Record<string, any> {
    return { ...this.config };
  }

  reset(): void {
    this.config = {};
  }
}
