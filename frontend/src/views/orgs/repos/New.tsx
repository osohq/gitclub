import { ChangeEvent, FormEvent, useContext, useState } from 'react';
import { Redirect, RouteComponentProps, useNavigate } from '@reach/router';

import { UserContext } from '../../../models';
import { NoticeContext } from '../../../components';
import { repo as repoApi } from '../../../api';

type Props = RouteComponentProps & { orgId?: string };

export function New({ orgId }: Props) {
  const user = useContext(UserContext);
  const { error } = useContext(NoticeContext);
  const [name, setName] = useState<string>('');
  const navigate = useNavigate();
  const index = `/orgs/${orgId}/repos`;

  if (user.current === 'Loading') return null;
  // If a guest navigates to this page, redirect to the repos index.
  if (user.current === 'Guest') return <Redirect to={index} noThrow />;

  const inputEmpty = !name.replaceAll(' ', '');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (inputEmpty || !orgId) return;
    try {
      const repo = await repoApi(orgId).create({ name });
      await navigate(`${index}/${repo.id}`);
    } catch (e) {
      error(`Failed to create new repo: ${e.message}`);
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
      <input type="submit" value="create" disabled={inputEmpty} />
    </form>
  );
}
