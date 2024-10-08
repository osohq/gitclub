# GitClub

This is an example application based on GitHub that's meant to model GitHub's
permissions system. The app is implemented in a number of backend languages,
which all expose a common API that is consumed by a React frontend (in the
`frontend/` folder).

This application is built as an example for the Oso library. [Oso library](https://github.com/osohq/oso) is now deprecated. If you are looking for an example of using [Oso Cloud](https://www.osohq.com/docs), check out
[GitCloud](https://github.com/osohq/gitcloud).

## Backends

For more information, check out one of the backend implementations linked below.

- [Flask SQLAlchemy Backend](backends/flask-sqlalchemy)
- [Flask SQLAlchemy Backend (with sqlalchemy-oso integration library)](backends/flask-sqlalchemy-oso)
- [Rails Backend](backends/rails)
- [Express/TypeORM Backend](backends/express-typeorm)
  
## Frontend

### Running the frontend

```console
$ cd frontend
$ yarn
$ yarn start
```

### Architecture

- TypeScript / React

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
