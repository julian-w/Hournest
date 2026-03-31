export interface TimeLock {
  id: number;
  year: number;
  month: number;
  locked_by: number;
  locked_by_name?: string;
  locked_at: string;
}
