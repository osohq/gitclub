import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Redirect, RouteComponentProps, useNavigate } from '@reach/router';

import { UserContext } from '../../models';
import { issue as issueApi } from '../../api';
import { NoticeContext } from '../../components';

type NewProps = RouteComponentProps & { orgId?: string; repoId?: string };

export function New({ orgId, repoId }: NewProps) {
  const user = useContext(UserContext);
  const { error } = useContext(NoticeContext);
  const [title, setTitle] = useState<string>('');
  const navigate = useNavigate();
  const index = `/orgs/${orgId}/repos/${repoId}/issues`;

  if (user.current === 'Loading') return null;
  // If a guest navigates to this page, redirect to the repos index.
  if (user.current === 'Guest') return <Redirect to={index} noThrow />;

  const inputEmpty = !title.replaceAll(' ', '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty || !orgId || !repoId) return;
    try {
      const issue = await issueApi(orgId, repoId).create({ title });
      await navigate(`${index}/${issue.id}`);
    } catch (e) {
      error(`Failed to create new issue: ${e.message}`);
    }
  }

  function handleChange({ target: { value } }: ChangeEvent<HTMLInputElement>) {
    setTitle(value);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        title: <input type="text" value={title} onChange={handleChange} />
      </label>{' '}
      <input type="submit" value="Create" disabled={inputEmpty} />
    </form>
  );
}
