import { useEffect, useState } from 'react';

import { Notice, noticeTypeToColor } from '.';

type Props = { notice: Notice; clear: () => void };

export function FlashNotice({ notice, clear }: Props) {
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
