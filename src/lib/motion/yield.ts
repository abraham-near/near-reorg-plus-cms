// Gives the main thread back between the steps of a long boot, so one big task (world, rail, Stack, each measuring the page) becomes several short
// ones: input and painting get a turn in between. scheduler.yield() where it exists (it keeps the task's priority), else a macrotask.
type Scheduler = { yield?: () => Promise<void> };
export function yieldToMain(): Promise<void> {
  const s = (globalThis as { scheduler?: Scheduler }).scheduler;
  if (s?.yield) return s.yield();
  return new Promise((r) => setTimeout(r, 0));
}
