import { Issue } from '../models';
import { create, index, show } from './helpers';

type Params = { title: string };

export function issue(orgId: string, repoId: string) {
  const path = `/orgs/${orgId}/repos/${repoId}/issues`;

  return {
    create: (body: Params) => create(path, body, Issue),

    index: () => index(path, Issue),

    show: (id: string) => show(`${path}/${id}`, Issue),
  };
}
