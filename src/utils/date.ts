export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isSameDay(dateA: Date | null | undefined, dateString: string): boolean {
  if (!dateA) return false;
  return dateA.toISOString().slice(0, 10) === dateString;
}
