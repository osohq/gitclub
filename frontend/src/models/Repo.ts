import { Org } from ".";

export class Repo {
  id: number;
  name: string;
  orgId: number;
  org?: Org;
  permissions: string[];

  constructor({ id, orgId, name, permissions = [] }: Repo) {
    this.id = id;
    this.orgId = orgId;
    this.name = name;
    this.permissions = permissions
  }
}
