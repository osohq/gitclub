import { User } from '../models';
import { show } from './helpers';

const path = '/users';

export const user = {
  show: (id: string) => show(`${path}/${id}`, User),
};
