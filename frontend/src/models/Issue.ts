import { Repo } from ".";

export class Issue {
  id: number;
  title: string;
  repo?: Repo
  repoId: number;

  constructor({ id, title, repoId }: Issue) {
    this.id = id;
    this.title = title;
    this.repoId = repoId;
  }
}
