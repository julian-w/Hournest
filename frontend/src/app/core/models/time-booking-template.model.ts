export interface TimeBookingTemplateItem {
  id?: number;
  cost_center_id: number;
  cost_center_name?: string;
  cost_center_code?: string;
  percentage: number;
}

export interface TimeBookingTemplate {
  id: number;
  user_id: number;
  name: string;
  items: TimeBookingTemplateItem[];
}
