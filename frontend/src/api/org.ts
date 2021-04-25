import { Org, User, UserRole } from '../models';
import type { OrgParams, UserRoleParams } from '../models';
import { create, del, get, index, show, update } from './helpers';

const orgCreate = (body: OrgParams) => create('/orgs', body, Org);

const orgIndex = () => index('/orgs', Org);

const orgShow = (orgId?: string) => show(`/orgs/${orgId}`, Org);

const orgRoleChoices = () => get('/org_role_choices') as Promise<string[]>;

const orgUserRoleCreate = (body: UserRoleParams, orgId?: string) =>
  create(`/orgs/${orgId}/roles`, body, UserRole);

const orgUserRoleDelete = (body: UserRoleParams, orgId?: string) =>
  del(`/orgs/${orgId}/roles`, body);

const orgUserRoleIndex = (orgId?: string) =>
  index(`/orgs/${orgId}/roles`, UserRole);

const orgUserRoleUpdate = (body: UserRoleParams, orgId?: string) =>
  update(`/orgs/${orgId}/roles`, body, UserRole);

const orgPotentialUsers = (orgId?: string) =>
  index(`/orgs/${orgId}/potential_users`, User);

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
