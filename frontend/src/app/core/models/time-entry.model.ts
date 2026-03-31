export interface TimeEntry {
  id: number;
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  net_working_minutes: number;
}
