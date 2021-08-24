class User < ApplicationRecord
  has_many :org_roles
  has_many :repo_roles

  def has_role_for_resource(role, resource)
    if resource.instance_of? Org
      org_roles.exists?(name: role, org: resource)
    elsif resource.instance_of? Repo
      repo_roles.exists?(name: role, repo: resource)
    end
  end
end
