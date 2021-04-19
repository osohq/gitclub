import { useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';

import type { PushErrorProp } from '../App';

type HomeProps = RouteComponentProps & PushErrorProp;

export function Home({ location, pushError }: HomeProps) {
  useEffect(() => {
    if (
      typeof location?.state === 'object' &&
      location.state !== null &&
      typeof (location.state as { error?: string }).error === 'string'
    )
      pushError((location.state as { error: string }).error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <h1>GitClub</h1>;
}
