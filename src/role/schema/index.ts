export class Role {
  id: number;
  name: string;
  permissions: string[];
  createdAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}
