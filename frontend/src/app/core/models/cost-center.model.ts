export interface CostCenter {
  id: number;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_active: boolean;
}
