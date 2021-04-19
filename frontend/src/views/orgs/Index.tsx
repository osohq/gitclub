import { useContext, useEffect, useState } from 'react';
import { Link, RouteComponentProps } from '@reach/router';

import { Org } from '../../models';
import { org as orgApi } from '../../api';
import { NotifyContext, UserContext } from '../../App';

export function Index(_: RouteComponentProps) {
  const user = useContext(UserContext);
  const { error } = useContext(NotifyContext);
  const [orgs, setOrgs] = useState<Org[]>([]);

  useEffect(() => {
    orgApi
      .index()
      .then((os) => setOrgs(os))
      .catch(error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const maybeNewLink = !user.loggedIn() ? null : (
    <Link to={`/orgs/new`}>Create new org</Link>
  );

  return (
    <>
      {maybeNewLink}
      <h1>Orgs</h1>
      <ul>
        {orgs.map((o) => (
          <li key={'org-' + o.id}>
            <Link to={`/orgs/${o.id}`}>{o.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
