import { User } from '../models';
import type { LoggedInUser } from '../models';
import { create, del, get } from './helpers';

type Params = { email: string };

const path = '/session';

export const session = {
  login: (body: Params) => create(path, body, User),

  logout: () => del(path, {}),

  whoami: () =>
    get(path).then(
      (u) => (u === null ? 'Guest' : new User(u as User)) as LoggedInUser
    ),
};
