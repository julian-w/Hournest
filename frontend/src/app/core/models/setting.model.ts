export interface AppSetting {
  key: string;
  value: string | null;
}

export interface AppSettings {
  default_work_days: number[];
  weekend_is_free: boolean;
  carryover_enabled: boolean;
  carryover_expiry_date: string | null;
}
