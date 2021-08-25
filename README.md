# GitClub

This is an example application based on GitHub that's meant to model GitHub's
permissions system. The app is implemented in a number of backend languages,
which all expose a common API that is consumed by a React frontend (in the
`frontend/` folder).

For more information, check out one of the backend implementations linked below.
## Backends
- [Flask SQLAlchemy Backend](backends/flask-sqlalchemy)
- [Rails Backend](backends/rails)
## Frontend

### Running the frontend

```console
$ cd frontend
$ yarn
$ yarn start
```

### Architecture

- TypeScript / React / Reach Router

## Development

The backends all run on port 5000, and use cookies to manage sessions.

If you want to be able to debug/test the backend without running the frontend
and logging in, you can use the following to save a session locally:

### Save the cookies

```bash
curl -c gitclub.cookies -H "Content-Type: application/json" -X POST -d '{"email": "john@beatles.com"}' localhost:5000/session
```

### Use the cookies

```bash
curl -b gitclub.cookies localhost:5000/orgs/1
```
