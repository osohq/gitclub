class RepoRole < ApplicationRecord
  belongs_to :user
  belongs_to :repo
end
