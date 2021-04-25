import { User } from '../models';
import type { LoggedInUser } from '../models';
import { create, del, get, show } from './helpers';

const login = (body: { email: string }) => create('/session', body, User);

const logout = () => del('/session', {});

const whoami: () => Promise<LoggedInUser> = () =>
  get('/session').then((u) => (u === null ? 'Guest' : new User(u as User)));

const userShow = (userId?: string) => show(`/users/${userId}`, User);

export const user = {
  login,
  logout,
  whoami,

  show: userShow,
};
