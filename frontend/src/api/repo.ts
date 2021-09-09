import { Repo } from '../models';
import { create, index, show } from './helpers';

type Params = { name: string };

export function repo(orgId: string) {
  const path = `/orgs/${orgId}/repos`;

  return {
    create: (body: Params) => create(path, body, Repo),

    index: () => index(path, Repo),

    show: (id: string) => show(`${path}/${id}`, Repo),
  };
}

export function userRepo(userId: string) {
  const path = `/users/${userId}/repos`;
  return {
    index: () => index(path, Repo),
  };
}
