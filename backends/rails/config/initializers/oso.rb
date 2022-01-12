require 'exceptions'
OSO = Oso::Oso.new not_found_error: Exceptions::NotFound, forbidden_error: Exceptions::Forbidden

Relation = Oso::Polar::DataFiltering::Relation
require 'oso/polar/data/adapter/active_record_adapter'
OSO.data_filtering_adapter = ::Oso::Polar::Data::Adapter::ActiveRecordAdapter.new

OSO.register_class(
  User,
  fields: {
    email: String,
    org_roles: Relation.new(
      kind: 'many',
      other_type: OrgRole,
      my_field: 'id',
      other_field: 'user_id'
    ),
    repo_roles: Relation.new(
      kind: 'many',
      other_type: RepoRole,
      my_field: 'id',
      other_field: 'user_id'
    )
  }
)

OSO.register_class(
  Org,
  fields: {
    name: String,
    base_repo_role: String,
    billing_address: String,
    repos: Relation.new(
      kind: 'many',
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
    org: Relation.new(
      kind: 'one',
      other_type: 'Org',
      my_field: 'org_id',
      other_field: 'id'
    ),
    issues: Relation.new(
      kind: 'many',
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
    repo: Relation.new(
      kind: 'one',
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
    org: Relation.new(
      kind: 'one',
      other_type: 'Org',
      my_field: 'org_id',
      other_field: 'id'
    ),
    user: Relation.new(
      kind: 'one',
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
    repo: Relation.new(
      kind: 'one',
      other_type: 'Repo',
      my_field: 'repo_id',
      other_field: 'id'
    ),
    user: Relation.new(
      kind: 'one',
      other_type: 'User',
      my_field: 'user_id',
      other_field: 'id'
    )
  }
)

OSO.load_files ["app/policy/authorization.polar"]
