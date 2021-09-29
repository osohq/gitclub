# GitClub (Rails)

This is an example application based on GitHub that's meant to model GitHub's
permissions system. The app uses the [`oso-oso`][rubygems-oso] library to model,
manage, and enforce authorization.

[rubygems-oso]: https://rubygems.org/gems/oso-oso

The [Oso documentation][docs] is a good reference for more information on Oso's
[Ruby][docs-ruby] integration.

This app also uses Oso's built-in roles functionality, which you can read about
[here][docs-ruby-roles].

[docs]: https://docs.osohq.com/
[docs-ruby]: https://docs.osohq.com/ruby/reference/installation.html
[docs-ruby-roles]: https://docs.osohq.com/ruby/guides/roles/getting-started.html

## Backend

### Running the backend

Install dependencies, migrate and seed the database, and start the server:

```console
$ cd backends/rails
$ bundle install
$ bundle exec rails db:migrate
$ bundle exec rails db:seed
$ bundle exec rails s
```
### Architecture

- Rails / ActiveRecord
- SQLite for persistence

### Key files

- [`initializers/oso.rb`][file-initializer]: Defines the `OSO` constant,
  registers the necessary models, and loads the policy.
- [`application_controller.rb`][file-app-controller]: Defines a small controller
  helper `authorize! :action, resource` that uses `OSO.allowed?` under the hood
  to enforce the authorization policy. Check out
  [`repos_controller.rb`][file-repos-controller] to see it in action.
- [`authorization.polar`][file-auth-polar]: The policy itself! Defines the roles
  used by the application, what each role is allowed to do, and how to fetch
  roles from a user during an authorization request.

[file-initializer]: config/initializers/oso.rb
[file-app-controller]: app/controllers/application_controller.rb
[file-repos-controller]: app/controllers/repos_controller.rb
[file-auth-polar]: app/policy/authorization.polar
### Data model

The app has the following models:

- `Org` - the top-level grouping of users and resources in the app. As with
  GitHub, users can be in multiple orgs and may have different permission
  levels in each.
- `User` - identified by email address, users can have roles within orgs and
  repos.
- `Repo` - mimicking repos on GitHub — but without the backing Git data — each
  belongs to a single org.
- `Issue` - mimicking GitHub issues, each is associated with a single repo.

### Authorization model

In addition to the "domain" models listed above, there are also the following
"Roles" models:

- `OrgRole`, which grant users either a `member` or `owner` role orgs.
- `RepoRole`, which grant users a `admin`, `maintainer`, or `reader` role on repos.

The roles models are used by the Oso policy to determine which orgs, repos, and
issues users can access. Those permissions are defined in
`app/authorization.polar`.
