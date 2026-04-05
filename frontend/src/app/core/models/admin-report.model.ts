export interface TimeBookingReportRow {
  group_by: 'user' | 'cost_center';
  group_key: number;
  label: string;
  code: string | null;
  percentage_points: number;
  booked_minutes: number;
}

export interface MissingEntryReportRow {
  user_id: number;
  user_name: string;
  date: string;
  reason: 'missing_time_entry' | 'incomplete_booking';
  expected_percentage: number;
  actual_percentage: number;
  has_time_entry: boolean;
}
