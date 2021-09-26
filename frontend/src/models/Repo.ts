import { Org } from ".";

export class Repo {
  id: number;
  name: string;
  orgId: number;
  org?: Org

  constructor({ id, orgId, name }: Repo) {
    this.id = id;
    this.orgId = orgId;
    this.name = name;
  }
}
