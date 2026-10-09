export interface Measure {
  readonly label: string;
  readonly size: number;
  readonly ms: number;
}

export function measure(label: string, size: number, run: () => void, repeats = 5): Measure {
  run();
  const start = performance.now();
  for (let i = 0; i < repeats; i++) run();
  return { label, size, ms: (performance.now() - start) / repeats };
}
