import { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { camelizeKeys, obj } from '../../helpers';
import { Org } from '../../models';

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

export function Index(_: RouteComponentProps) {
  const [orgs, setOrgs] = useState<Org[]>([]);

  useEffect(() => {
    (async () => {
      const orgs = await fetchOrgs();
      if (orgs) setOrgs(orgs);
    })();
  }, []);

  return (
    <>
      <Link to="/orgs/new">Create new org</Link>
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
