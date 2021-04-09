export class Repo {
  id: number;
  name: string;

  constructor({ id, name }: Repo) {
    this.id = id;
    this.name = name;
  }
}
