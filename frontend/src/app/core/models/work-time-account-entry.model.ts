export interface WorkTimeAccountEntry {
  id: number | string;
  user_id: number;
  effective_date: string;
  type: 'opening_balance' | 'worked' | 'manual_adjustment' | 'carryover';
  minutes_delta: number;
  balance_after: number;
  comment: string | null;
  created_at: string;
  created_by: number | null;
  created_by_name: string | null;
  source_type: 'opening_balance' | 'time_entry' | 'manual';
  source_id: number | string | null;
}
