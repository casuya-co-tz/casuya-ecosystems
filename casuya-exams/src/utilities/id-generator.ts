let counter = 0;

export function generateId(prefix = 'ex'): string {
  counter++;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}_${counter}`;
}

export function resetCounter(): void {
  counter = 0;
}
