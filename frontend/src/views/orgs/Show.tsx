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

import { Org, User, UserContext, UserRole, UserRoleParams } from '../../models';
import { org as orgApi } from '../../api';
import { NoticeContext } from '../../components';

type ShowProps = RouteComponentProps & { orgId?: string };

export function Show({ orgId }: ShowProps) {
  const { error, redirectWithError } = useContext(NoticeContext);
  const [org, setOrg] = useState<Org>();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    orgApi
      .show(orgId)
      .then((o) => setOrg(o))
      .catch(redirectWithError);
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    orgApi
      .roleChoices()
      .then((rs) => setRoles(rs))
      .catch((e) => error(`Failed to fetch role choices: ${e.message}`));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orgId || !org) return null;

  return (
    <>
      <h1>{org.name}</h1>
      <h4>Billing Address: {org.billingAddress}</h4>
      <h4>Base Repo Role: {org.baseRepoRole}</h4>

      <h2>
        <Link to={`/orgs/${orgId}/repos`}>Repos</Link>
      </h2>

      <UserRoles
        orgId={orgId}
        userRoles={userRoles}
        setUserRoles={setUserRoles}
        roles={roles}
        setRefetch={setRefetch}
      />

      {roles.length && (
        <NewUserRole
          orgId={orgId}
          setUserRoles={setUserRoles}
          roles={roles}
          refetch={refetch}
          setRefetch={setRefetch}
        />
      )}
    </>
  );
}

type UserRolesProps = RolesProps & {
  userRoles: UserRole[];
};

function UserRoles({
  orgId,
  userRoles,
  setUserRoles,
  roles,
  setRefetch,
}: UserRolesProps) {
  const user = useContext(UserContext);
  const { error } = useContext(NoticeContext);

  useEffect(() => {
    orgApi
      .userRoleIndex(orgId)
      .then((urs) => setUserRoles(urs))
      .catch((e) => error(`Failed to fetch user roles: ${e.message}`));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateRole(user: User, role: string) {
    const body = { userId: user.id, role };
    try {
      const updated = await orgApi.userRoleUpdate(body, orgId);
      setUserRoles((urs) =>
        // Assumes a user has a single role per org.
        urs.map((old) => (old.user.id === updated.user.id ? updated : old))
      );
    } catch (e) {
      error(`Failed to update user role: ${e.message}`);
    }
  }

  async function deleteRole({ user, role }: UserRole) {
    orgApi
      .userRoleDelete({ userId: user.id, role }, orgId)
      .then(() => {
        // Assumes a user has a single role per org.
        setUserRoles((urs) => urs.filter((ur) => ur.user.id !== user.id));
        setRefetch((x) => !x);
      })
      .catch((e) => error(`Failed to delete user role: ${e.message}`));
  }

  return (
    <>
      <h2>Role assignments</h2>
      <ul>
        {userRoles.map((ur) => (
          <li key={'user-role-' + ur.user.id + ur.role}>
            <Link to={`/users/${ur.user.id}`}>{ur.user.email}</Link> -{' '}
            <select
              disabled={!user.loggedIn()}
              name="role"
              value={ur.role}
              onChange={({ target: { value } }) => updateRole(ur.user, value)}
            >
              {roles.map((r) => (
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
                deleteRole(ur);
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
  setUserRoles: Dispatch<SetStateAction<UserRole[]>>;
  roles: string[];
  setRefetch: Dispatch<SetStateAction<boolean>>;
};

type NewUserRoleProps = RolesProps & {
  refetch: boolean;
};

function NewUserRole({
  orgId,
  setUserRoles,
  roles,
  refetch,
  setRefetch,
}: NewUserRoleProps) {
  const user = useContext(UserContext);
  const { error } = useContext(NoticeContext);
  const [users, setUsers] = useState<User[]>([]);
  const [details, setDetails] = useState<UserRoleParams>({
    userId: 0,
    role: roles[0],
  });

  useEffect(() => {
    if (user.loggedIn()) {
      orgApi
        .potentialUsers(orgId)
        .then((users) => {
          setUsers(users);
          setDetails((ur) => ({ ...ur, userId: users[0] ? users[0].id : 0 }));
        })
        .catch((e) => error(`Failed to fetch potential users: ${e.message}`));
    }
  }, [orgId, refetch, user.current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user.loggedIn() || !users.length) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const newUserRole = await orgApi.userRoleCreate(details, orgId);
      setRefetch((x) => !x);
      setDetails((ur) => ({ ...ur, userId: 0 }));
      setUserRoles((urs) => [...urs, { ...newUserRole }]);
    } catch (e) {
      error(`Failed to create new user role: ${e.message}`);
    }
  }

  function handleChange({
    target: { name, value },
  }: ChangeEvent<HTMLSelectElement>) {
    setDetails((ur) => ({ ...ur, [name]: value }));
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
            {roles.map((r) => (
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
