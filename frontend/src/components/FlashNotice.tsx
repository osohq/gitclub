import { useEffect, useState } from 'react';

type NoticeType = 'error' | 'info';

export type Notice = {
  text: string;
  type: NoticeType;
};

function noticeTypeToColor(t: NoticeType): string {
  switch (t) {
    case 'error':
      return 'red';
    case 'info':
      return 'blue';
    default:
      return ((_: never) => _)(t);
  }
}

type FlashNoticeProps = { notice: Notice; clear: () => void };

export function FlashNotice({ notice, clear }: FlashNoticeProps) {
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (active) {
      const id = setTimeout(clear, 5000);
      return () => clearTimeout(id);
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{ color: noticeTypeToColor(notice.type) }}
      onMouseEnter={() => setActive(false)}
      onMouseLeave={() => setActive(true)}
    >
      {notice.text}
    </div>
  );
}
