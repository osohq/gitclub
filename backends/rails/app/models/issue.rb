class Issue < ApplicationRecord
  belongs_to :repo
  belongs_to :creator, class_name: "User"
end
