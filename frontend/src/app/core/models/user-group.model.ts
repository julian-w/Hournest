import { User } from './user.model';
import { CostCenter } from './cost-center.model';

export interface UserGroup {
  id: number;
  name: string;
  description: string | null;
  members?: User[];
  cost_centers?: CostCenter[];
  member_count?: number;
  cost_center_count?: number;
}
