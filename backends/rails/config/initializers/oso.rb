OSO = Oso.new
Relationship = Oso::Polar::DataFiltering::Relationship

OSO.register_class(
  User,
  fetcher: User::FETCHER,
  fields: {
    id: Integer,
    email: String,
  }
)

OSO.register_class(
  Org,
  fetcher: Org::FETCHER,
  fields: {
    id: Integer,
    name: String,
    base_repo_role: String,
    billing_address: String,
    repos: Relationship.new(
      kind: 'children',
      other_type: 'Repo',
      my_field: 'id',
      other_field: 'org_id',
    )
  }
)

OSO.register_class(
  Repo,
  fetcher: Repo::FETCHER,
  fields: {
    id: Integer,
    org_id: Integer,
    name: String,
    org: Relationship.new(
      kind: 'parent',
      other_type: 'Org',
      my_field: 'org_id',
      other_field: 'id'
    ),
    issues: Relationship.new(
      kind: 'children',
      other_type: 'Issue',
      my_field: 'id',
      other_field: 'repo_id'
    )
  }
)

OSO.register_class(
  Issue,
  fetcher: Issue::FETCHER,
  fields: {
    id: Integer,
    repo_id: Integer,
    title: String,
    repo: Relationship.new(
      kind: 'parent',
      other_type: 'Repo',
      my_field: 'repo_id',
      other_field: 'id'
    )
  }
)

OSO.register_class(
  OrgRole,
  fetcher: OrgRole::FETCHER,
  fields: {
    id: Integer,
    org_id: Integer,
    user_id: Integer,
    name: String,
    org: Relationship.new(
      kind: 'parent',
      other_type: 'Org',
      my_field: 'org_id',
      other_field: 'id'
    ),
    user: Relationship.new(
      kind: 'parent',
      other_type: 'User',
      my_field: 'user_id',
      other_field: 'id'
    )
  }
)

OSO.register_class(
  RepoRole,
  fetcher: RepoRole::FETCHER,
  fields: {
    id: Integer,
    repo_id: Integer,
    user_id: Integer,
    name: String,
    repo: Relationship.new(
      kind: 'parent',
      other_type: 'Repo',
      my_field: 'repo_id',
      other_field: 'id'
    ),
    user: Relationship.new(
      kind: 'parent',
      other_type: 'User',
      my_field: 'user_id',
      other_field: 'id'
    )
  }
)

# TODO: do this automatically with a module or something?
# Unfortunately we're not guaranteed to have loaded those classes yet though
[
#  User,
#  Org,
#  Repo,
#  Issue
].each do |klass|
  OSO.register_class(klass)
end

OSO.load_file("app/policy/authorization.polar")
OSO.enable_roles()
