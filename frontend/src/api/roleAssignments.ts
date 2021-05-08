import { User, RoleAssignment } from '../models';
import type { RoleAssignmentParams as Params } from '../models';
import { create, del, index, update } from './helpers';

function org(id: string) {
  const roleAssignments = `/orgs/${id}/role_assignments`;
  const unassignedUsers = `/orgs/${id}/unassigned_users`;

  return {
    // TODO(gj): rename UserRole -> RoleAssignment
    create: (body: Params) => create(roleAssignments, body, RoleAssignment),

    delete: (body: Params) => del(roleAssignments, body),

    index: () => index(roleAssignments, RoleAssignment),

    update: (body: Params) => update(roleAssignments, body, RoleAssignment),

    unassignedUsers: () => index(unassignedUsers, User),
  };
}

export const roleAssignments = { org };
