import { createContext } from 'react';

type NoticeType = 'error' | 'info';

export function noticeTypeToColor(t: NoticeType): string {
  switch (t) {
    case 'error':
      return 'red';
    case 'info':
      return 'blue';
    default:
      return ((_: never) => _)(t);
  }
}

export type Notice = {
  text: string;
  type: NoticeType;
};

export const NoticeContext = createContext({
  error: (_: string) => console.error('override me'),
  redirectWithError: (_?: string) => console.error('override me'),
});
