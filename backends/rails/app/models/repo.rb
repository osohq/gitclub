class Repo < ApplicationRecord
  belongs_to :org

  has_many :issues
end
