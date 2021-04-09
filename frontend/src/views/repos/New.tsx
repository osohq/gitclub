import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Redirect, RouteComponentProps, useNavigate } from '@reach/router';

import { UserContext } from '../../App';
import { repo as repoApi } from '../../api';

interface NewProps extends RouteComponentProps {
  orgId?: string;
}

export function New({ orgId }: NewProps) {
  const user = useContext(UserContext);
  const [name, setName] = useState<string>('');
  const navigate = useNavigate();

  // If a guest navigates to this page, redirect to the repos index.
  if (user === 'Guest') return <Redirect to={`/orgs/${orgId}/repos`} noThrow />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Don't allow empty strings.
    if (!name.replaceAll(' ', '')) return;
    await repoApi.create({ name }, orgId);
    await navigate(`/orgs/${orgId}/repos`);
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setName(value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        name: <input type="text" value={name} onChange={handleChange} />
      </label>{' '}
      <input type="submit" value="Create" />
    </form>
  );
}
