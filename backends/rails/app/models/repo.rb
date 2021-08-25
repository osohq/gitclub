require 'fetcher'
class Repo < ApplicationRecord
  include Fetcher
  belongs_to :org

  has_many :issues
end
