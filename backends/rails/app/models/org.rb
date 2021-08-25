require 'fetcher'
class Org < ApplicationRecord
  include Fetcher
  has_many :repos
end
