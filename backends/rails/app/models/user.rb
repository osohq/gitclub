class User < ApplicationRecord
  has_many :org_roles
  has_many :repo_roles

  def org_role_names
    org_roles.map(&:name)
  end

  def repo_role_names
    repo_roles.map(&:name)
  end
end
