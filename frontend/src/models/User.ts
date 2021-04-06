export class User {
  id: number;
  email: string;

  constructor({ id, email }: User) {
    this.id = id;
    this.email = email;
  }
}
