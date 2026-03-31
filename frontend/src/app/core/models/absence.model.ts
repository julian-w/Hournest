export type AbsenceType = 'illness' | 'special_leave';
export type AbsenceScope = 'full_day' | 'morning' | 'afternoon';
export type AbsenceStatus = 'reported' | 'acknowledged' | 'pending' | 'approved' | 'rejected' | 'admin_created';

export interface Absence {
  id: number;
  user_id: number;
  user_name?: string;
  start_date: string;
  end_date: string;
  type: AbsenceType;
  scope: AbsenceScope;
  status: AbsenceStatus;
  comment: string | null;
  admin_comment: string | null;
  reviewed_by: number | null;
  reviewer_name?: string;
  reviewed_at: string | null;
  created_at: string;
}
