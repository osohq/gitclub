export class Role {
  id: number;
  name: string;

  constructor({ id, name }: Role) {
    this.id = id;
    this.name = name;
  }
}
