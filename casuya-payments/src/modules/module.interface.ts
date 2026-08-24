export interface Module {
  initialize(): Promise<void>;
  terminate(): Promise<void>;
}