export type OrgParams = {
  name: string;
  billingAddress: string;
  baseRepoRole: string;
};

export class Org {
  id: number;
  name: string;
  billingAddress: string;
  baseRepoRole: string;

  constructor({ id, name, billingAddress, baseRepoRole }: Org) {
    this.id = id;
    this.name = name;
    this.billingAddress = billingAddress;
    this.baseRepoRole = baseRepoRole;
  }
}
