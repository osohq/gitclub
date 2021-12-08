require 'uri'
require 'net/http'

class OsoRemote
  class RepoRole < ActiveRecord::Base
  end

  def self.has_role(user, role_name, resource)
    uri = URI("http://localhost:5000/_oso_internal/#{user.id}/#{role_name}/#{resource.id}")
    res = Net::HTTP.get_response(uri)
    return JSON.parse(res.body) if res.is_a?(Net::HTTPSuccess)
    false
  end
end
