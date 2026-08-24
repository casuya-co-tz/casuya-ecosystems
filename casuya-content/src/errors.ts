export class ContentServiceError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, statusCode = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class NotFoundError extends ContentServiceError {
  constructor(entity: string, id: string) {
    super(`${entity} '${id}' not found`, 'NOT_FOUND', 404, { entity, id });
  }
}

export class ValidationError extends ContentServiceError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class DuplicateError extends ContentServiceError {
  constructor(entity: string, field: string, value: string) {
    super(`${entity} with ${field} '${value}' already exists`, 'DUPLICATE', 409, { entity, field, value });
  }
}

export class CycleError extends ContentServiceError {
  constructor(entity: string, id: string, parentId: string) {
    super(`Moving ${entity} '${id}' under '${parentId}' would create a circular reference`, 'CYCLE_DETECTED', 400, { entity, id, parentId });
  }
}

export class InvalidStateError extends ContentServiceError {
  constructor(entity: string, id: string, state: string, reason: string) {
    super(`${entity} '${id}' is in state '${state}': ${reason}`, 'INVALID_STATE', 409, { entity, id, state, reason });
  }
}
