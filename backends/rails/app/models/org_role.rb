require 'fetcher'
class OrgRole < ApplicationRecord
  include Fetcher
  include Osoable
  belongs_to :user
  belongs_to :org

  def actor
    user
  end

  def resource
    org
  end
end
