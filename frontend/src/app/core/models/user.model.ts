export interface User {
  id: number;
  email: string;
  display_name: string;
  role: 'employee' | 'admin' | 'superadmin';
  vacation_days_per_year: number;
  remaining_vacation_days: number;
  holidays_exempt: boolean;
  weekend_worker: boolean;
  must_change_password?: boolean;
}
