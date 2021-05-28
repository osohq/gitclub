import { RouteComponentProps } from '@reach/router';
import { useEffect, useState } from 'react';

import { FlashNotice, Notice, NoticeContext } from '../components';
import { View } from '.';

type Props = RouteComponentProps & { children: JSX.Element[] };

const redirectWithError = (e?: string) => {
  const { pathname } = window.location;
  const error = typeof e === 'string' ? e : `Failed to load ${pathname}`;
  sessionStorage.setItem('error', error);
  window.history.back();
};

export function Notices({ children, location }: Props) {
  const [notices, setNotices] = useState<Map<string, Notice>>(new Map());

  const push = (n: Notice) =>
    setNotices((ns) => new Map(ns.set(n.type + n.text, n)));
  const pop = (n: Notice) =>
    setNotices((ns) => new Map([...ns].filter(([k]) => k !== n.type + n.text)));

  const error = (text: string) => push({ type: 'error', text });

  useEffect(() => {
    const e = sessionStorage.getItem('error');
    if (e) {
      error(e);
      sessionStorage.removeItem('error');
    }
  }, [location?.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const flashNotices = [...notices.values()].map((notice, i) => (
    <FlashNotice key={i} notice={notice} clear={() => pop(notice)} />
  ));

  return (
    <NoticeContext.Provider value={{ error, redirectWithError }}>
      <View.Nav />
      {flashNotices}
      {children}
    </NoticeContext.Provider>
  );
}
