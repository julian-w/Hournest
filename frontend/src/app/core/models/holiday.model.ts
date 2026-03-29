export interface Holiday {
  id: number;
  name: string;
  date: string;
  type: 'fixed' | 'variable';
  start_year: number;
  end_year: number | null;
}

export interface HolidayInstance {
  holiday_id: number;
  name: string;
  type: 'fixed' | 'variable';
  year: number;
  date: string | null;
  confirmed: boolean;
}
