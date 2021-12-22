require 'uri'
require 'net/http'

class OsoRemote
  class RepoRole < ActiveRecord::Base
  end

  def self.reset_timer
    @@duration = 0
  end

  def self.get_duration
    @@duration
  end

  def self.has_role(user, role_name, resource)
    start = Time.now
    uri = URI("http://localhost:5002/has_role/User/#{user.id}/#{role_name}/Repo/#{resource.id}")
    res = Net::HTTP.get_response(uri)
    @@duration += (Time.now - start) * 1000.0
    return JSON.parse(res.body) if res.is_a?(Net::HTTPSuccess)
    false
  end
end
