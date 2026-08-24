export function getNextSlide(index: number, length: number): number {
  if (length <= 1) return 0;
  return (index + 1) % length;
}

export function getPreviousSlide(index: number, length: number): number {
  if (length <= 1) return 0;
  return (index - 1 + length) % length;
}
