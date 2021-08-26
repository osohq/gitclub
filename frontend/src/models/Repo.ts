export class Repo {
  id: number;
  name: string;
  orgId: number;

  constructor({ id, orgId, name }: Repo) {
    this.id = id;
    this.orgId = orgId;
    this.name = name;
  }
}
