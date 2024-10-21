import { Role } from '../../account/guards/role.enum';

export class User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  roles: Role[];
  createdAt: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
}
