import { Issue, Repo, User } from '../models';
import { index, show } from './helpers';
import { index as IssueIndex } from './issue-helpers';

const path = '/users';

export const user = {
  show: (id: string) => show(`${path}/${id}`, User),
};

export function userRepo(userId: string | number) {
  const path = `/users/${userId}/repos`;
  return {
    index: () => index(path, Repo),
  };
}
