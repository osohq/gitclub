import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  Fragment,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { UserContext } from './App';
import { camelizeKeys, obj, snakeifyKeys } from './helpers';
import { Org, User } from './models';

type NewOrgParams = {
  name: string;
  billingAddress: string;
  baseRepoRole: string;
};

async function createOrg(details: NewOrgParams): Promise<Org | undefined> {
  try {
    const res = await fetch('http://localhost:5000/orgs', {
      body: JSON.stringify(snakeifyKeys(details)),
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (res.status === 201) {
      const data = await res.json();
      return new Org(camelizeKeys(data) as Org);
    } else {
      console.error('TODO(gj): better error handling -- alert?');
    }
  } catch (e) {
    console.error('wot', e);
  }
}

interface OrgNewProps extends RouteComponentProps {
  setOrgs: Dispatch<SetStateAction<Org[]>>;
}

async function fetchRepoRoleChoices(): Promise<string[] | undefined> {
  try {
    const res = await fetch('http://localhost:5000/repo_role_choices', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 200) return await res.json();
  } catch (_) {}
}

function OrgNew({ setOrgs }: OrgNewProps) {
  const user = useContext(UserContext);
  const [details, setDetails] = useState<NewOrgParams>({
    name: '',
    billingAddress: '',
    baseRepoRole: '',
  });
  const [repoRoles, setRepoRoles] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const repoRoles = await fetchRepoRoleChoices();
      if (repoRoles) {
        setDetails((details) => ({ ...details, baseRepoRole: repoRoles[0] }));
        setRepoRoles(repoRoles);
      }
    })();
  }, []);

  if (user === 'Guest') return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { name, billingAddress } = details;
    // Don't allow empty strings.
    if (!name.replaceAll(' ', '') || !billingAddress.replaceAll(' ', ''))
      return;
    const org = await createOrg(details);
    if (org) {
      setDetails({ name: '', billingAddress: '', baseRepoRole: repoRoles[0] });
      setOrgs((orgs) => [...orgs, org]);
    }
  }

  function handleChange({
    target: { name, value },
  }: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setDetails({ ...details, [name]: value });
  }

  return (
    <form onSubmit={handleSubmit}>
      {(['name', 'billingAddress'] as const).map((field) => (
        <Fragment key={field}>
          <label>
            {field.replace(/[A-Z]/g, (l) => ' ' + l.toLowerCase())}:{' '}
            <input
              type="text"
              name={field}
              value={details[field]}
              onChange={handleChange}
            />
          </label>{' '}
        </Fragment>
      ))}
      {repoRoles.length && (
        <label>
          base repo role:{' '}
          <select
            name="baseRepoRole"
            value={details.baseRepoRole}
            onChange={handleChange}
          >
            {repoRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      )}{' '}
      <input type="submit" value="Create" />
    </form>
  );
}

async function fetchOrgs(): Promise<Org[] | undefined> {
  try {
    const res = await fetch('http://localhost:5000/orgs', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 200) {
      const data: obj[] = await res.json();
      return data.map((o) => new Org(camelizeKeys(o) as Org));
    }
  } catch (_) {}
}

export function OrgIndex(_: RouteComponentProps) {
  const [orgs, setOrgs] = useState<Org[]>([]);

  useEffect(() => {
    (async () => {
      const orgs = await fetchOrgs();
      if (orgs) setOrgs(orgs);
    })();
  }, []);

  return (
    <>
      <h2>Create new org</h2>
      <OrgNew setOrgs={setOrgs} />
      <h2>Existing orgs</h2>
      <ul>
        {orgs.map((o) => (
          <li key={'org-' + o.id}>
            <Link to={`/orgs/${o.id}`}>
              {o.id} - {o.name}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

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
