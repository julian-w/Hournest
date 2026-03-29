export interface VacationLedgerEntry {
  id: number;
  user_id: number;
  year: number;
  type: 'entitlement' | 'carryover' | 'bonus' | 'taken' | 'expired' | 'adjustment';
  days: number;
  comment: string | null;
  vacation_id: number | null;
  created_at: string;
}
