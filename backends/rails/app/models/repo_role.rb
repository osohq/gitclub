require 'fetcher'
class RepoRole < ApplicationRecord
  include Fetcher
  belongs_to :user
  belongs_to :repo
end
