class User < ApplicationRecord
  has_many :org_roles
  has_many :repo_roles
end
