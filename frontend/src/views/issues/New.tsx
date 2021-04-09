import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Redirect, RouteComponentProps, useNavigate } from '@reach/router';

import { UserContext } from '../../App';
import { issue as issueApi } from '../../api';

interface NewProps extends RouteComponentProps {
  orgId?: string;
  repoId?: string;
}

export function New({ orgId, repoId }: NewProps) {
  const user = useContext(UserContext);
  const [title, setTitle] = useState<string>('');
  const navigate = useNavigate();
  const index = `/orgs/${orgId}/repos/${repoId}/issues`;

  // If a guest navigates to this page, redirect to the repos index.
  if (user === 'Guest') return <Redirect to={index} noThrow />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Don't allow empty strings.
    if (!title.replaceAll(' ', '')) return;
    await issueApi.create({ title }, orgId, repoId);
    await navigate(index);
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setTitle(value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        title: <input type="text" value={title} onChange={handleChange} />
      </label>{' '}
      <input type="submit" value="Create" />
    </form>
  );
}
