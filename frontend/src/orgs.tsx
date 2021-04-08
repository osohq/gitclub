import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { camelizeKeys, obj, snakeifyKeys } from './helpers';
import { Org, User } from './models';

interface OrgShowProps extends RouteComponentProps {
  orgId?: string;
}

export function OrgShow({ orgId }: OrgShowProps) {
  const [org, setOrg] = useState<Org>();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [refetch, setRefetch] = useState(false);

  useEffect(() => {
    (async function () {
      try {
        const res = await fetch(`http://localhost:5000/orgs/${orgId}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });
        if (res.status === 200) {
          const data = await res.json();
          setOrg(new Org(camelizeKeys(data) as Org));
        }
      } catch (_) {}
    })();
  }, [orgId]);

  useEffect(() => {
    (async () => {
      const roles = await fetchOrgRoleChoices();
      if (roles) setRoles(roles);
    })();
  }, []);

  if (!orgId || !org) return null;

  return (
    <>
      <h1>{org.name}</h1>
      <h4>Billing Address: {org.billingAddress}</h4>
      <h4>Base Repo Role: {org.baseRepoRole}</h4>

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

type UserRole = { user: User; role: string };

async function fetchOrgRoles(orgId?: string): Promise<UserRole[] | undefined> {
  try {
    const res = await fetch(`http://localhost:5000/orgs/${orgId}/roles`, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 200) {
      const data: obj[] = await res.json();
      return data.map((o) => ({
        user: new User(o.user as User),
        role: (o.role as { id: number; name: string }).name as string,
      }));
    }
  } catch (_) {}
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
  useEffect(() => {
    (async () => {
      const roles = await fetchOrgRoles(orgId);
      if (roles) setUserRoles(roles);
    })();
  }, [orgId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateRole(user: User, role: string) {
    try {
      const res = await fetch(`http://localhost:5000/orgs/${orgId}/roles`, {
        body: JSON.stringify({ user_id: user.id, role }),
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      });
      if (res.status === 204) {
        setUserRoles((urs) =>
          // Assumes a user has a single role per org.
          urs.map((ur) => (ur.user.id === user.id ? { ...ur, role } : ur))
        );
      } else {
        console.error('TODO(gj): better error handling -- alert?');
      }
    } catch (e) {
      console.error('wot', e);
    }
  }

  async function deleteRole(ur: UserRole) {
    try {
      const { user, role } = ur;
      const res = await fetch(`http://localhost:5000/orgs/${orgId}/roles`, {
        body: JSON.stringify({ user_id: user.id, role }),
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'DELETE',
      });
      if (res.status === 204) {
        // Assumes a user has a single role per org.
        setUserRoles((urs) => urs.filter((ur) => ur.user.id !== user.id));
        setRefetch((x) => !x);
      } else {
        console.error('TODO(gj): better error handling -- alert?');
      }
    } catch (e) {
      console.error('wot', e);
    }
  }

  return (
    <>
      <h2>Role assignments</h2>
      <ul>
        {userRoles.map((ur) => (
          <li key={'user-role-' + ur.user.id + ur.role}>
            <Link to={`/users/${ur.user.id}`}>{ur.user.email}</Link> -{' '}
            <select
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

async function fetchPotentialUsers(
  orgId?: string
): Promise<User[] | undefined> {
  try {
    const res = await fetch(
      `http://localhost:5000/orgs/${orgId}/potential_users`,
      {
        credentials: 'include',
        headers: { Accept: 'application/json' },
      }
    );
    if (res.status === 200) {
      const data: User[] = await res.json();
      return data.map((o) => new User(o));
    }
  } catch (_) {}
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

async function fetchOrgRoleChoices(): Promise<string[] | undefined> {
  try {
    const res = await fetch('http://localhost:5000/org_role_choices', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 200) return await res.json();
  } catch (_) {}
}

async function createOrgRole(
  orgId: string,
  details: NewUserRoleParams
): Promise<UserRole | undefined> {
  try {
    const res = await fetch(`http://localhost:5000/orgs/${orgId}/roles`, {
      body: JSON.stringify(snakeifyKeys(details)),
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (res.status === 201) {
      const data: obj = await res.json();
      return {
        user: new User(data.user as User),
        role: (data.role as { id: number; name: string }).name as string,
      };
    } else {
      console.error('TODO(gj): better error handling -- alert?');
    }
  } catch (e) {
    console.error('wot', e);
  }
}

type NewUserRoleParams = { userId: number; role: string };

function NewUserRole({
  orgId,
  setUserRoles,
  roles,
  refetch,
  setRefetch,
}: NewUserRoleProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<NewUserRoleParams>({
    userId: 0,
    role: roles[0],
  });

  useEffect(() => {
    (async () => {
      const users = await fetchPotentialUsers(orgId);
      if (users) {
        setUsers(users);
        setUserRole((ur) => ({ ...ur, userId: users[0] ? users[0].id : 0 }));
      }
    })();
  }, [orgId, refetch]);

  if (!users.length) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const newUserRole = await createOrgRole(orgId, userRole);
    if (newUserRole) {
      setRefetch((x) => !x);
      setUserRole((ur) => ({ ...ur, userId: 0 }));
      setUserRoles((urs) => [...urs, { ...newUserRole }]);
    }
  }

  function handleChange({
    target: { name, value },
  }: ChangeEvent<HTMLSelectElement>) {
    setUserRole((ur) => ({ ...ur, [name]: value }));
  }

  return (
    <>
      <h2>Assign new role</h2>
      <form onSubmit={handleSubmit}>
        <label>
          user:{' '}
          <select name="userId" value={userRole.userId} onChange={handleChange}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          role:{' '}
          <select name="role" value={userRole.role} onChange={handleChange}>
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
