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
import { org as orgApi, repo as repoApi } from '../../api';
import { OrgParams } from '../../models';
import { NoticeContext } from '..';

export function New(_: RouteComponentProps) {
  const user = useContext(UserContext);
  const { error, redirectWithError } = useContext(NoticeContext);
  const [details, setDetails] = useState<OrgParams>({
    name: '',
    billingAddress: '',
    baseRepoRole: '',
  });
  const [repoRoleChoices, setRepoRoleChoices] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user.loggedIn()) {
      repoApi
        .roleChoices()
        .then((cs) => {
          setDetails((details) => ({
            ...details,
            baseRepoRole: cs[0],
          }));
          setRepoRoleChoices(cs);
        })
        .catch((e) =>
          redirectWithError(`Failed to fetch role choices: ${e.message}`)
        );
    }
  }, [user.current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (user.current === 'Loading') return null;
  // If a guest navigates to this page, redirect to the orgs index.
  if (user.current === 'Guest') return <Redirect to="/orgs" noThrow />;

  function validInputs() {
    const { name, billingAddress } = details;
    // Don't allow empty strings.
    return name.replaceAll(' ', '') && billingAddress.replaceAll(' ', '');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validInputs()) return;
    try {
      const org = await orgApi.create(details);
      await navigate(`/orgs/${org.id}`);
    } catch (e) {
      error(`Failed to create new org: ${e.message}`);
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
      <input type="submit" value="Create" disabled={!validInputs()} />
    </form>
  );
}
