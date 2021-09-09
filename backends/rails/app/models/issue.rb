require 'fetcher'
class Issue < ApplicationRecord
  include Fetcher
  belongs_to :repo
end
