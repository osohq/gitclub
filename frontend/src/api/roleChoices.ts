import { get } from './helpers';

const org = () => get(`/org_role_choices`) as Promise<string[]>;

const repo = () => get(`/repo_role_choices`) as Promise<string[]>;

export const roleChoices = { org, repo };
