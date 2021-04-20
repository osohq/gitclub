import { RouteComponentProps } from '@reach/router';
import React, { useEffect, useState } from 'react';

import { FlashNotice, Notice } from '../components';
import { isObj, obj, popField } from '../helpers';

export const NoticeContext = React.createContext({
  error: (_: string) => console.error('override me'),
  redirectWithError: (_?: string) => console.error('override me'),
});

const popState = (state: obj, field: string) =>
  window.history.replaceState(popField(state, field), document.title);

type NoticesProps = RouteComponentProps & { children: JSX.Element[] };

export function Notices({ children, location, navigate }: NoticesProps) {
  const [notices, setNotices] = useState<Map<string, Notice>>(new Map());

  const push = (n: Notice) =>
    setNotices((ns) => new Map(ns.set(n.type + n.text, n)));
  const error = (text: string) => push({ type: 'error', text });
  const pop = (n: Notice) =>
    setNotices(
      (ns) => new Map(Object.entries(ns).filter(([k]) => k !== n.type + n.text))
    );
  const redirectWithError = (e?: string) => {
    const { pathname } = location!;
    const segments = pathname.slice(1).split('/').filter(Boolean);
    const to = '/' + segments.reverse().slice(1).reverse().join('/');
    const error = typeof e === 'string' ? e : `Failed to load ${pathname}`;
    navigate!(to, { state: { error } });
  };

  useEffect(() => {
    if (!location || !isObj(location.state)) return;
    if (typeof location.state.error === 'string') {
      error(location.state.error);
      popState(location.state, 'error');
    }
  }, [location]); // eslint-disable-line react-hooks/exhaustive-deps

  const flashNotices = [...notices.values()].map((notice, i) => (
    <FlashNotice key={i} notice={notice} clear={() => pop(notice)} />
  ));
  return (
    <NoticeContext.Provider value={{ error, redirectWithError }}>
      {flashNotices}
      {children}
    </NoticeContext.Provider>
  );
}
