import {
  ChangeEvent,
  Dispatch,
  FormEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  RoleAssignment,
  RoleAssignmentParams,
  User,
  UserContext,
} from '../models';
import type { RoleAssignmentsApi } from '../api';
import { NoticeContext, RoleSelector } from '.';

type Props = {
  api: RoleAssignmentsApi;
  setAssignments: Dispatch<SetStateAction<RoleAssignment[]>>;
  roleChoices: string[];
  setRefetch: Dispatch<SetStateAction<boolean>>;
  refetch: boolean;
};

export function NewRoleAssignment({
  api,
  setAssignments,
  roleChoices,
  refetch,
  setRefetch,
}: Props) {
  const user = useContext(UserContext);
  const { error } = useContext(NoticeContext);
  const [users, setUsers] = useState<User[]>([]);
  const [details, setDetails] = useState<RoleAssignmentParams>({
    userId: 0,
    role: roleChoices[0],
  });

  useEffect(() => {
    if (user.loggedIn()) {
      api
        .unassignedUsers()
        .then((users) => {
          setUsers(users);
          setDetails((ds) => ({ ...ds, userId: users[0] ? users[0].id : 0 }));
        })
        .catch((e) => error(`Failed to fetch unassigned users: ${e.message}`));
    }
  }, [refetch, user.current]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user.loggedIn() || !users.length) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const assignment = await api.create(details);
      setRefetch((x) => !x);
      setDetails((details) => ({ ...details, userId: 0 }));
      setAssignments((assignments) => [...assignments, { ...assignment }]);
    } catch (e) {
      error(`Failed to create new role assignment: ${e.message}`);
    }
  }

  function handleChange({
    target: { name, value },
  }: ChangeEvent<HTMLSelectElement>) {
    setDetails((details) => ({ ...details, [name]: value }));
  }

  return (
    <>
      <h2>Assign new role</h2>
      <form onSubmit={handleSubmit}>
        <label>
          user:{' '}
          <select name="userId" value={details.userId} onChange={handleChange}>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          role:{' '}
          <RoleSelector
            choices={roleChoices}
            selected={details.role}
            update={handleChange}
          />
        </label>{' '}
        <input type="submit" value="Assign" />
      </form>
    </>
  );
}
