require 'fetcher'
class RepoRole < ApplicationRecord
  include Fetcher
  include Osoable
  belongs_to :user
  belongs_to :repo

  def actor
    user
  end

  def resource
    repo
  end
end
