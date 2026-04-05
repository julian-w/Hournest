export interface WorkSchedule {
  id: number;
  user_id: number;
  start_date: string;
  end_date: string | null;
  work_days: number[];
  weekly_target_minutes: number;
}
