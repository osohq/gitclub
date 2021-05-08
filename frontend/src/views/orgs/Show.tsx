import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import {
  Org,
  RoleAssignment,
  RoleAssignmentParams,
  User,
  UserContext,
} from '../../models';
import {
  org as orgApi,
  roleAssignments as roleAssignmentsApi,
  roleChoices as roleChoicesApi,
} from '../../api';
import { NoticeContext } from '../../components';

type ShowProps = RouteComponentProps & { orgId?: string };

export function Show({ orgId }: ShowProps) {
  const { error, redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>([]);
  const [roleChoices, setRoleChoices] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    orgApi
      .show(orgId)
      .then((o) => setOrg(o))
      .catch(redirectWithError);
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!orgId) return;
    roleChoicesApi
      .org()
      .then((choices) => setRoleChoices(choices))
      .catch((e) => error(`Failed to fetch role choices: ${e.message}`));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orgId || !org) return null;

  return (
    <>
      <h1>{org.name}</h1>
      <h4>Billing Address: {org.billingAddress}</h4>
      <h4>Base Repo Role: {org.baseRepoRole}</h4>

      <h2>
        <Link to={`/orgs/${orgId}/repos`}>Repos</Link>
      </h2>

      <RoleAssignments
        orgId={orgId}
        roleAssignments={roleAssignments}
        setRoleAssignments={setRoleAssignments}
        roleChoices={roleChoices}
        setRefetch={setRefetch}
      />

      {roleChoices.length && (
        <NewRoleAssignment
          orgId={orgId}
          setRoleAssignments={setRoleAssignments}
          roleChoices={roleChoices}
          refetch={refetch}
          setRefetch={setRefetch}
        />
      )}
    </>
  );
}

type RoleAssignmentsProps = RolesProps & {
  roleAssignments: RoleAssignment[];
};

function RoleAssignments({
  orgId,
  roleAssignments,
  setRoleAssignments,
  roleChoices,
  setRefetch,
}: RoleAssignmentsProps) {
  const user = useContext(UserContext);
  const { error } = useContext(NoticeContext);

  useEffect(() => {
    roleAssignmentsApi
      .org(orgId)
      .index()
      .then((assignments) => setRoleAssignments(assignments))
      .catch((e) => error(`Failed to fetch role assignments: ${e.message}`));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateRoleAssignment(user: User, role: string) {
    const body = { userId: user.id, role };
    try {
      const updated = await roleAssignmentsApi.org(orgId).update(body);
      setRoleAssignments((assignments) =>
        // Assumes a user has a single role per org.
        assignments.map((old) =>
          old.user.id === updated.user.id ? updated : old
        )
      );
    } catch (e) {
      error(`Failed to update role assignment: ${e.message}`);
    }
  }

  async function deleteRoleAssignment({ user, role }: RoleAssignment) {
    roleAssignmentsApi
      .org(orgId)
      .delete({ userId: user.id, role })
      .then(() => {
        // Assumes a user has a single role per org.
        setRoleAssignments((as) => as.filter((a) => a.user.id !== user.id));
        setRefetch((x) => !x);
      })
      .catch((e) => error(`Failed to delete role assignment: ${e.message}`));
  }

  return (
    <>
      <h2>Role assignments</h2>
      <ul>
        {roleAssignments.map((assignment) => (
          <li key={'user-role-' + assignment.user.id + assignment.role}>
            <Link to={`/users/${assignment.user.id}`}>
              {assignment.user.email}
            </Link>{' '}
            -{' '}
            <select
              disabled={!user.loggedIn()}
              name="role"
              value={assignment.role}
              onChange={({ target: { value } }) =>
                updateRoleAssignment(assignment.user, value)
              }
            >
              {roleChoices.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>{' '}
            -{' '}
            <button
              disabled={!user.loggedIn()}
              onClick={(e) => {
                e.preventDefault();
                deleteRoleAssignment(assignment);
              }}
            >
              delete
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

type RolesProps = {
  orgId: string;
  setRoleAssignments: Dispatch<SetStateAction<RoleAssignment[]>>;
  roleChoices: string[];
  setRefetch: Dispatch<SetStateAction<boolean>>;
};

type NewRoleAssignmentProps = RolesProps & {
  refetch: boolean;
};

function NewRoleAssignment({
  orgId,
  setRoleAssignments,
  roleChoices,
  refetch,
  setRefetch,
}: NewRoleAssignmentProps) {
  const user = useContext(UserContext);
  const { error } = useContext(NoticeContext);
  const [users, setUsers] = useState<User[]>([]);
  const [details, setDetails] = useState<RoleAssignmentParams>({
    userId: 0,
    role: roleChoices[0],
  });

  useEffect(() => {
    if (user.loggedIn()) {
      roleAssignmentsApi
        .org(orgId)
        .unassignedUsers()
        .then((users) => {
          setUsers(users);
          setDetails((ds) => ({ ...ds, userId: users[0] ? users[0].id : 0 }));
        })
        .catch((e) => error(`Failed to fetch unassigned users: ${e.message}`));
    }
  }, [orgId, refetch, user.current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user.loggedIn() || !users.length) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const assignment = await roleAssignmentsApi.org(orgId).create(details);
      setRefetch((x) => !x);
      setDetails((details) => ({ ...details, userId: 0 }));
      setRoleAssignments((assignments) => [...assignments, { ...assignment }]);
    } catch (e) {
      error(`Failed to create new role assignment: ${e.message}`);
    }
  }

  function handleChange({
    target: { name, value },
  }: ChangeEvent<HTMLSelectElement>) {
    setDetails((details) => ({ ...details, [name]: value }));
  }

  return (
    <>
      <h2>Assign new role</h2>
      <form onSubmit={handleSubmit}>
        <label>
          user:{' '}
          <select name="userId" value={details.userId} onChange={handleChange}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          role:{' '}
          <select name="role" value={details.role} onChange={handleChange}>
            {roleChoices.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>{' '}
        <input type="submit" value="Assign" />
      </form>
    </>
  );
}
