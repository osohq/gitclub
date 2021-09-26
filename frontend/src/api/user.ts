import { Issue, Repo, User } from '../models';
import { index, show } from './helpers';

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

export function userIssue(userId: string | number) {
  const path = `/users/${userId}/issues`;
  return {
    index: () => index(path, Issue),
  };
}
