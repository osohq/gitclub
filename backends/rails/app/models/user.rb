require 'fetcher'
class User < ApplicationRecord
  include Fetcher
  has_many :org_roles
  has_many :repo_roles
end
