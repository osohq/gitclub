import { Redirect, RouteComponentProps } from '@reach/router';

export const NotFound = (_: RouteComponentProps) => <Redirect to="/" noThrow />;
