import { User, RoleAssignment } from '../models';
import type { RoleAssignmentParams as Params } from '../models';
import { create, del, index, update } from './helpers';

export type RoleAssignmentsApi = {
  create: (body: Params) => Promise<RoleAssignment>;
  delete: (body: Params) => Promise<RoleAssignment>;
  index: () => Promise<RoleAssignment[]>;
  update: (body: Params) => Promise<RoleAssignment>;
  unassignedUsers: () => Promise<User[]>;
};

function org(id: string): RoleAssignmentsApi {
  const roleAssignments = `/orgs/${id}/role_assignments`;
  const unassignedUsers = `/orgs/${id}/unassigned_users`;

  return {
    create: (body: Params) => create(roleAssignments, body, RoleAssignment),

    delete: (body: Params) => del(roleAssignments, body),

    index: () => index(roleAssignments, RoleAssignment),

    update: (body: Params) => update(roleAssignments, body, RoleAssignment),

    unassignedUsers: () => index(unassignedUsers, User),
  };
}

function repo(orgId: string, repoId: string): RoleAssignmentsApi {
  const roleAssignments = `/orgs/${orgId}/repos/${repoId}/role_assignments`;
  const unassignedUsers = `/orgs/${orgId}/repos/${repoId}/unassigned_users`;

  return {
    create: (body: Params) => create(roleAssignments, body, RoleAssignment),

    delete: (body: Params) => del(roleAssignments, body),

    index: () => index(roleAssignments, RoleAssignment),

    update: (body: Params) => update(roleAssignments, body, RoleAssignment),

    unassignedUsers: () => index(unassignedUsers, User),
  };
}

export const roleAssignments = { org, repo };
