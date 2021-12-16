require 'fetcher'
class RepoRole < ApplicationRecord
  include Fetcher
  include Osoable
  belongs_to :user
  belongs_to :repo
end
