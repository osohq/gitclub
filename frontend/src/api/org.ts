import { Org } from '../models';
import type { OrgParams as Params } from '../models';
import { create, index, show } from './helpers';

const path = `/orgs`;

export const org = {
  create: (body: Params) => create(path, body, Org),

  index: () => index(path, Org),

  show: (id: string) => show(`${path}/${id}`, Org),
};
