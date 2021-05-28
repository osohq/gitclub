import { Dispatch, SetStateAction, useContext, useEffect } from 'react';
import { Link } from '@reach/router';

import { RoleAssignment, User, UserContext } from '../models';
import { RoleAssignmentsApi } from '../api';
import { NoticeContext, RoleSelector } from '.';

type Props = {
  api: RoleAssignmentsApi;
  assignments: RoleAssignment[];
  setAssignments: Dispatch<SetStateAction<RoleAssignment[]>>;
  roleChoices: string[];
  setRefetch: Dispatch<SetStateAction<boolean>>;
};

export function RoleAssignments({
  api,
  assignments,
  setAssignments,
  roleChoices,
  setRefetch,
}: Props) {
  const { current: currentUser, loggedIn } = useContext(UserContext);
  const { error } = useContext(NoticeContext);

  useEffect(() => {
    api
      .index()
      .then(setAssignments)
      .catch((e) => error(`Failed to fetch role assignments: ${e.message}`));
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  function update(user: User, role: string) {
    api
      .update({ userId: user.id, role })
      .then((next) => {
        const { id } = next.user;
        // NOTE(gj): Assumes a user has a single role per resource.
        setAssignments((as) => as.map((a) => (a.user.id === id ? next : a)));
      })
      .catch((e) => error(`Failed to update role assignment: ${e.message}`));
  }

  function remove({ user, role }: RoleAssignment) {
    api
      .delete({ userId: user.id, role })
      .then(() => {
        // NOTE(gj): Assumes a user has a single role per resource.
        setAssignments((as) => as.filter((a) => a.user.id !== user.id));
        setRefetch((x) => !x);
      })
      .catch((e) => error(`Failed to delete role assignment: ${e.message}`));
  }

  return (
    <ul>
      {assignments.map(({ user, role }) => (
        <li key={'user-role-' + user.id + role}>
          <Link to={`/users/${user.id}`}>{user.email}</Link> -{' '}
          <RoleSelector
            choices={roleChoices}
            update={({ target: { value } }) => update(user, value)}
            selected={role}
          />{' '}
          -{' '}
          <button
            disabled={!loggedIn()}
            onClick={(e) => {
              e.preventDefault();
              remove({ user, role });
            }}
          >
            delete
          </button>
        </li>
      ))}
    </ul>
  );
}
