import { RouteComponentProps } from '@reach/router';
import { useEffect, useState } from 'react';

import { FlashNotice, Notice, NoticeContext } from '../components';
import { Nav } from '.';

type NoticesProps = RouteComponentProps & { children: JSX.Element[] };

export function Notices({ children, location }: NoticesProps) {
  const [notices, setNotices] = useState<Map<string, Notice>>(new Map());

  const push = (n: Notice) =>
    setNotices((ns) => new Map(ns.set(n.type + n.text, n)));
  const pop = (n: Notice) =>
    setNotices((ns) => new Map([...ns].filter(([k]) => k !== n.type + n.text)));

  const error = (text: string) => push({ type: 'error', text });

  const redirectWithError = (e?: string) => {
    const error =
      typeof e === 'string' ? e : `Failed to load ${location!.pathname}`;
    sessionStorage.setItem('error', error);
    // TODO(gj): navigate(-1) throws errors that I don't feel like debugging.
    window.history.back();
  };

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
      <Nav />
      {flashNotices}
      {children}
    </NoticeContext.Provider>
  );
}
