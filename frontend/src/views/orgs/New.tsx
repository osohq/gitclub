import {
  ChangeEvent,
  FormEvent,
  Fragment,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Redirect, RouteComponentProps, useNavigate } from '@reach/router';

import { UserContext } from '../../App';
import { camelizeKeys, snakeifyKeys } from '../../helpers';
import { Org } from '../../models';

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

async function fetchRepoRoleChoices(): Promise<string[] | undefined> {
  try {
    const res = await fetch('http://localhost:5000/repo_role_choices', {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (res.status === 200) return await res.json();
  } catch (_) {}
}

export function New(_: RouteComponentProps) {
  const user = useContext(UserContext);
  const [details, setDetails] = useState<NewOrgParams>({
    name: '',
    billingAddress: '',
    baseRepoRole: '',
  });
  const [repoRoleChoices, setRepoRoleChoices] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const repoRoleChoices = await fetchRepoRoleChoices();
      if (repoRoleChoices) {
        setDetails((details) => ({
          ...details,
          baseRepoRole: repoRoleChoices[0],
        }));
        setRepoRoleChoices(repoRoleChoices);
      }
    })();
  }, []);

  // If a guest user navigates to this page, redirect to the orgs index.
  if (user === 'Guest') return <Redirect to="/orgs" noThrow />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const { name, billingAddress } = details;
    // Don't allow empty strings.
    if (!name.replaceAll(' ', '') || !billingAddress.replaceAll(' ', ''))
      return;
    const org = await createOrg(details);
    if (org) await navigate('/orgs');
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
      {repoRoleChoices.length && (
        <label>
          base repo role:{' '}
          <select
            name="baseRepoRole"
            value={details.baseRepoRole}
            onChange={handleChange}
          >
            {repoRoleChoices.map((r) => (
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
