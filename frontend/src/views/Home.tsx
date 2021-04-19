import { useContext, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import { NotifyContext } from '../App';

export function Home({ location }: RouteComponentProps) {
  const notify = useContext(NotifyContext);
  useEffect(() => {
    if (
      typeof location?.state === 'object' &&
      location.state !== null &&
      typeof (location.state as { error?: string }).error === 'string'
    )
      notify.error((location.state as { error: string }).error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <h1>GitClub</h1>;
}
