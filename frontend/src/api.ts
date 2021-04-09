import { camelizeKeys, obj, snakeifyKeys } from './helpers';
import { Org, User, UserRole } from './models';
import type { LoggedInUser, OrgParams, UserRoleParams } from './models';

const ROOT = 'http://localhost:5000';

type Class<T extends {} = {}> = new (...args: any[]) => T;

async function del(path: string, successStatus: number, body: obj) {
  const res = await fetch(ROOT + path, {
    body: JSON.stringify(snakeifyKeys(body)),
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    method: 'DELETE',
  });
  if (res.status !== successStatus) throw new Error(res.statusText);
}

async function get(path: string, successStatus: number): Promise<unknown> {
  const res = await fetch(ROOT + path, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  if (res.status === successStatus) {
    return res.json();
  } else throw new Error(res.statusText);
}

async function patch(
  path: string,
  successStatus: number,
  body: obj
): Promise<unknown> {
  const res = await fetch(ROOT + path, {
    body: JSON.stringify(snakeifyKeys(body)),
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    method: 'PATCH',
  });
  if (res.status === successStatus) {
    return res.json();
  } else throw new Error(res.statusText);
}

async function post(
  path: string,
  successStatus: number,
  body: obj
): Promise<unknown> {
  const res = await fetch(ROOT + path, {
    body: JSON.stringify(snakeifyKeys(body)),
    credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (res.status === successStatus) {
    return res.json();
  } else throw new Error(res.statusText);
}

async function create<T>(
  path: string,
  successStatus: number,
  body: obj,
  cls: Class<T>
): Promise<T> {
  const data = (await post(path, successStatus, body)) as obj;
  return new cls(camelizeKeys(data));
}

async function index<T>(
  path: string,
  successStatus: number,
  cls: Class<T>
): Promise<T[]> {
  const data = (await get(path, successStatus)) as obj[];
  return data.map((d) => new cls(camelizeKeys(d)));
}

async function show<T>(
  path: string,
  successStatus: number,
  cls: Class<T>
): Promise<T> {
  const data = (await get(path, successStatus)) as obj;
  return new cls(camelizeKeys(data));
}

async function update<T>(
  path: string,
  successStatus: number,
  body: obj,
  cls: Class<T>
): Promise<T> {
  const data = (await patch(path, successStatus, body)) as obj;
  return new cls(camelizeKeys(data));
}

const orgCreate = (body: OrgParams) => create('/orgs', 201, body, Org);

const orgIndex = () => index('/orgs', 200, Org);

const orgShow = (orgId?: string) => show(`/orgs/${orgId}`, 200, Org);

const orgRoleChoices = () => get('/org_role_choices', 200) as Promise<string[]>;

const orgUserRoleCreate = (body: UserRoleParams, orgId?: string) =>
  create(`/orgs/${orgId}/roles`, 201, body, UserRole);

const orgUserRoleDelete = (body: UserRoleParams, orgId?: string) =>
  del(`/orgs/${orgId}/roles`, 204, body);

const orgUserRoleIndex = (orgId?: string) =>
  index(`/orgs/${orgId}/roles`, 200, UserRole);

const orgUserRoleUpdate = (body: UserRoleParams, orgId?: string) =>
  update(`/orgs/${orgId}/roles`, 200, body, UserRole);

const orgPotentialUsers = (orgId?: string) =>
  index(`/orgs/${orgId}/potential_users`, 200, User);

export const org = {
  create: orgCreate,
  index: orgIndex,
  show: orgShow,

  roleChoices: orgRoleChoices,
  potentialUsers: orgPotentialUsers,

  userRoleCreate: orgUserRoleCreate,
  userRoleDelete: orgUserRoleDelete,
  userRoleIndex: orgUserRoleIndex,
  userRoleUpdate: orgUserRoleUpdate,
};

const repoRoleChoices = () =>
  get('/repo_role_choices', 200) as Promise<string[]>;

export const repo = {
  roleChoices: repoRoleChoices,
};

const login = (body: { user: string }) => create('/login', 200, body, User);

const logout = () => get('/logout', 200);

const whoami: () => Promise<LoggedInUser> = () =>
  get('/whoami', 200).then((u) => (u === null ? 'Guest' : new User(u as User)));

export const user = {
  login,
  logout,
  whoami,
};
