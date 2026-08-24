import { ExportFormat } from './types';

export interface ExportConfig {
  format: ExportFormat;
  compression?: boolean;
  include_headers?: boolean;
  batch_size?: number;
  options?: Record<string, unknown>;
}

export interface ExportProvider {
  readonly name: string;
  readonly supportedFormats: ExportFormat[];
  configure(config: ExportConfig): Promise<void>;
  export(data: Record<string, unknown>[]): Promise<string>;
  validate(data: Record<string, unknown>[]): boolean;
  shutdown(): Promise<void>;
}
