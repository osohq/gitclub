import { ChangeEvent, useContext } from 'react';

import { UserContext } from '../models';

type Props = {
  choices: string[];
  name?: string;
  selected: string;
  update: (e: ChangeEvent<HTMLSelectElement>) => void;
};

export function RoleSelector({ choices, name, selected, update }: Props) {
  const { loggedIn } = useContext(UserContext);

  return (
    <select
      disabled={!loggedIn() || !choices.length}
      name={name || 'role'}
      value={selected}
      onChange={update}
    >
      {choices.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
