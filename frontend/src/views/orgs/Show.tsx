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

import { Org, User, UserRole } from '../../models';
import type { UserRoleParams } from '../../models';
import { org as orgApi } from '../../api';
import { UserContext } from '../../App';

interface ShowProps extends RouteComponentProps {
  orgId?: string;
}

export function Show({ orgId }: ShowProps) {
  const [org, setOrg] = useState<Org>();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    orgApi.show(orgId).then((o) => setOrg(o));
  }, [orgId]);

  useEffect(() => {
    orgApi.roleChoices().then((rs) => setRoles(rs));
  }, []);

  if (!orgId || !org) return null;

  return (
    <>
      <h1>{org.name}</h1>
      <h4>Billing Address: {org.billingAddress}</h4>
      <h4>Base Repo Role: {org.baseRepoRole}</h4>

      <Link to={`/orgs/${orgId}/repos`}>Repos</Link>

      {roles.length && (
        <NewUserRole
          orgId={orgId}
          setUserRoles={setUserRoles}
          roles={roles}
          refetch={refetch}
          setRefetch={setRefetch}
        />
      )}
      <UserRoles
        orgId={orgId}
        userRoles={userRoles}
        setUserRoles={setUserRoles}
        roles={roles}
        setRefetch={setRefetch}
      />
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
  useEffect(() => {
    orgApi.userRoleIndex(orgId).then((urs) => setUserRoles(urs));
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateRole(user: User, role: string) {
    const body = { userId: user.id, role };
    const updated = await orgApi.userRoleUpdate(body, orgId);
    setUserRoles((urs) =>
      // Assumes a user has a single role per org.
      urs.map((old) => (old.user.id === updated.user.id ? updated : old))
    );
  }

  async function deleteRole({ user, role }: UserRole) {
    orgApi
      .userRoleDelete({ userId: user.id, role: role.name }, orgId)
      .then(() => {
        // Assumes a user has a single role per org.
        setUserRoles((urs) => urs.filter((ur) => ur.user.id !== user.id));
        setRefetch((x) => !x);
      });
  }

  return (
    <>
      <h2>Role assignments</h2>
      <ul>
        {userRoles.map((ur) => (
          <li key={'user-role-' + ur.user.id + ur.role}>
            <Link to={`/users/${ur.user.id}`}>{ur.user.email}</Link> -{' '}
            <select
              disabled={user === 'Guest'}
              name="role"
              value={ur.role.name}
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
              disabled={user === 'Guest'}
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
  const [users, setUsers] = useState<User[]>([]);
  const [details, setDetails] = useState<UserRoleParams>({
    userId: 0,
    role: roles[0],
  });

  useEffect(() => {
    if (user !== 'Guest') {
      orgApi.potentialUsers(orgId).then((users) => {
        setUsers(users);
        setDetails((ur) => ({ ...ur, userId: users[0] ? users[0].id : 0 }));
      });
    }
  }, [orgId, refetch, user]);

  if (user === 'Guest' || !users.length) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newUserRole = await orgApi.userRoleCreate(details, orgId);
    setRefetch((x) => !x);
    setDetails((ur) => ({ ...ur, userId: 0 }));
    setUserRoles((urs) => [...urs, { ...newUserRole }]);
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
