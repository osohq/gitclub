import { createContext } from 'react';

export type LoggedInUser = User | 'Guest' | 'Loading';

export class User {
  id: number;
  email: string;

  constructor({ id, email }: User) {
    this.id = id;
    this.email = email;
  }
}

export const UserContext = createContext<{
  current: LoggedInUser;
  loggedIn: () => boolean;
  update: (u: LoggedInUser) => void;
}>({
  current: 'Loading',
  loggedIn: () => false,
  update: (_) => console.error('override me'),
});
