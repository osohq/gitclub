import { Repo } from '../models';
import { create, get, index, show } from './helpers';

const repoCreate = (body: { name: string }, orgId?: string) =>
  create(`/orgs/${orgId}/repos`, body, Repo);

const repoIndex = (orgId?: string) => index(`/orgs/${orgId}/repos`, Repo);

const repoShow = (orgId?: string, repoId?: string) =>
  show(`/orgs/${orgId}/repos/${repoId}`, Repo);

const repoRoleChoices = () => get('/repo_role_choices') as Promise<string[]>;

export const repo = {
  create: repoCreate,
  index: repoIndex,
  show: repoShow,

  roleChoices: repoRoleChoices,
};
