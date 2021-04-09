import { useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Org } from '../../models';
import { org as orgApi } from '../../api';

export function Index(_: RouteComponentProps) {
  const [orgs, setOrgs] = useState<Org[]>([]);

  useEffect(() => {
    orgApi.index().then((os) => setOrgs(os));
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
