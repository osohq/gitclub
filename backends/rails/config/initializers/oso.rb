OSO = Oso.new
Relationship = Oso::Polar::DataFiltering::Relationship

OSO.register_class(
  User,
  fields: {
    email: String,
  }
)

OSO.register_class(
  Org,
  fields: {
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
  fields: {
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
  fields: {
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
  fields: {
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
  fields: {
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

OSO.load_file("app/policy/authorization.polar")
OSO.enable_roles()
