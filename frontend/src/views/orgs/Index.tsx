import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Org } from '../../models';
import { org as orgApi } from '../../api';
import { UserContext } from '../../App';

export function Index(_: RouteComponentProps) {
  const user = useContext(UserContext);
  const [orgs, setOrgs] = useState<Org[]>([]);

  useEffect(() => {
    orgApi.index().then((os) => setOrgs(os));
  }, []);

  const maybeNewLink =
    user === 'Guest' ? null : <Link to={`/orgs/new`}>Create new org</Link>;

  return (
    <>
      {maybeNewLink}
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
