export interface AbsenceReportRow {
  id: number;
  user_id: number;
  user_name: string;
  type: 'illness' | 'special_leave';
  scope: 'full_day' | 'morning' | 'afternoon';
  status: 'reported' | 'acknowledged' | 'pending' | 'approved' | 'rejected' | 'admin_created';
  start_date: string;
  end_date: string;
  comment: string | null;
  admin_comment: string | null;
}
