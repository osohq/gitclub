require 'fetcher'
class OrgRole < ApplicationRecord
  include Fetcher
  belongs_to :user
  belongs_to :org
end
