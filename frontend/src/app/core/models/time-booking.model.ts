export interface TimeBooking {
  id: number;
  user_id: number;
  date: string;
  cost_center_id: number;
  cost_center_name?: string;
  cost_center_code?: string;
  percentage: number;
  comment: string | null;
}
