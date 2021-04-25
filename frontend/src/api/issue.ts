import { Issue } from '../models';
import { create, index, show } from './helpers';

type body = { title: string };
const issueCreate = (body: body, orgId?: string, repoId?: string) =>
  create(`/orgs/${orgId}/repos/${repoId}/issues`, body, Issue);

const issueIndex = (orgId?: string, repoId?: string) =>
  index(`/orgs/${orgId}/repos/${repoId}/issues`, Issue);

const issueShow = (orgId?: string, repoId?: string, issueId?: string) =>
  show(`/orgs/${orgId}/repos/${repoId}/issues/${issueId}`, Issue);

export const issue = {
  create: issueCreate,
  index: issueIndex,
  show: issueShow,
};
