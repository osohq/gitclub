import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Redirect, RouteComponentProps, useNavigate } from '@reach/router';

import { NotifyContext, UserContext } from '../../App';
import { repo as repoApi } from '../../api';

interface NewProps extends RouteComponentProps {
  orgId?: string;
}

export function New({ orgId }: NewProps) {
  const user = useContext(UserContext);
  const { error } = useContext(NotifyContext);
  const [name, setName] = useState<string>('');
  const navigate = useNavigate();
  const index = `/orgs/${orgId}/repos`;

  if (user.current === 'Loading') return null;
  // If a guest navigates to this page, redirect to the repos index.
  if (user.current === 'Guest') return <Redirect to={index} noThrow />;

  const inputEmpty = !name.replaceAll(' ', '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty) return;
    try {
      const repo = await repoApi.create({ name }, orgId);
      await navigate(`${index}/${repo.id}`);
    } catch (e) {
      error(e);
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setName(value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        name: <input type="text" value={name} onChange={handleChange} />
      </label>{' '}
      <input type="submit" value="Create" disabled={inputEmpty} />
    </form>
  );
}
