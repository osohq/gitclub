require 'active_record'

# Connect to an in-memory sqlite3 database
ActiveRecord::Base.establish_connection(
  adapter: 'sqlite3',
  database: '../db/development.sqlite3'
)

# Define the models
class User < ActiveRecord::Base
end

class Repository
  attr_reader :id

  def initialize(id)
    @id = id
  end

  def self.find(id)
    self.new(id)
  end

  def actions
    return [
      Action.new(self, "#3", "running"),
      Action.new(self, "#2", "failure"),
      Action.new(self, "#1", "success")
    ]
  end
end

class Action
  attr_reader :repository, :name, :status
  def initialize(repository, name, status)
    @repository = repository
    @name = name
    @status = status
  end

  def status_html
    case status
    when "running"; "<span style='color: #444; font-weight: bold;'>RUNNING</span>"
    when "failure"; "<span style='color: #a22; font-weight: bold;'>FAILURE</span>"
    when "success"; "<span style='color: #2a2; font-weight: bold;'>SUCCESS</span>"
    end
  end
end

class Session
  def self.create(request, id)
    request.cookies[:user_id] = id
  end

  def self.get_user(request)
    User.find(request.cookies[:user_id])
  end
end
