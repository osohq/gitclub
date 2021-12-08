## Multi-service Oso Demo

To run the "Gitclub Actions" service, change into the `gitclub-actions` folder
and run:

```sh
bundle install
bundle exec ruby server.rb
```

That will start a server on port 5001. At the same time (i.e. in another
terminal), run this from the `backends/rails` folder:

```sh
bundle exec rails db:seed
bundle exec rails s
```

Now you should have two servers running, at ports 5000 and 5001.

Visit [http://localhost:5001/login/1](http://localhost:5001/login/1) to log in
as `john@beatles.com`. You'll be redirected to the actions page for repo 1,
which you can see john has full access to.

By logging in as different users, you can see how their permissions are
reflected in the Actions UI (the action buttons don't do anything, yet).

For example, paul@beatles.com cannot restart or cancel actions, because Paul is
only a "reader" on repository 1. Also, mike@monsters.com can't see the
repository at all, because Mike belongs to a different organization.
