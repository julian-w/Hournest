export type VacationScope = 'full_day' | 'morning' | 'afternoon';

export interface Vacation {
  id: number;
  user_id: number;
  user_name?: string;
  start_date: string;
  end_date: string;
  scope: VacationScope;
  workdays: number;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  reviewed_by: number | null;
  reviewer_name?: string;
  reviewed_at: string | null;
  created_at: string;
}
