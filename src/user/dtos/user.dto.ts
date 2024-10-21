import { IsNotEmpty, IsOptional } from 'class-validator';

export class UserDTO {
  @IsOptional()
  firstName: string;

  @IsOptional()
  lastName: string;

  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  password: string;
}

export type TUser = {
  id: number;

  firstName: string;

  lastName: string;

  email: string;

  passwordHash: string;
};
