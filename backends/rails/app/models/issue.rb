require 'fetcher'
class Issue < ApplicationRecord
  include Fetcher
  belongs_to :repo
  belongs_to :creator, class_name: "User"
end
