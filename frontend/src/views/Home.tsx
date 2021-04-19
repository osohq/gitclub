import { useContext, useEffect } from 'react';
import { RouteComponentProps } from '@reach/router';
import { NotifyContext } from '../App';
import { isObj, obj } from '../helpers';

const popField = (o: obj, f: string) =>
  Object.fromEntries(Object.entries(o).filter(([k]) => k !== f));

const popState = (state: obj, field: string) =>
  window.history.replaceState(popField(state, field), document.title);

export function Home({ location }: RouteComponentProps) {
  const notify = useContext(NotifyContext);
  useEffect(() => {
    if (!location || !isObj(location.state)) return;
    if (typeof location.state.error === 'string') {
      notify.error(location.state.error);
      popState(location.state, 'error');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <h1>GitClub</h1>;
}
