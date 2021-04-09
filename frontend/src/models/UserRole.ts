import { Role, User } from '.';

export type UserRoleParams = { userId: number; role: string };

export class UserRole {
  user: User;
  role: Role;

  constructor({ user, role }: UserRole) {
    this.user = new User(user);
    this.role = new Role(role);
  }
}
