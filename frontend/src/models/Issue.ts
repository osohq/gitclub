export class Issue {
  id: number;
  title: string;

  constructor({ id, title }: Issue) {
    this.id = id;
    this.title = title;
  }
}
