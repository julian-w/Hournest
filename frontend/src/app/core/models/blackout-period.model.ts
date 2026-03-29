export interface BlackoutPeriod {
  id: number;
  type: 'freeze' | 'company_holiday';
  start_date: string;
  end_date: string;
  reason: string;
  created_at: string;
}
