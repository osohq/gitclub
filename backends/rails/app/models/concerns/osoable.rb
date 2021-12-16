require 'net/http'

module Osoable
  extend ActiveSupport::Concern

  included do
    after_commit -> { sync_to_oso(true, false) }, on: :create
    after_commit -> { sync_to_oso(true, true) }, on: :update
    after_commit -> { sync_to_oso(false, true) }, on: :destroy

    def sync_to_oso(create, delete)
      puts "We're syncing to oso!"

      actor_type = self.actor.class.name
      actor_id = self.actor.id
      resource_type = self.resource.class.name
      resource_id = self.resource.id

      if delete
        puts "DELETING"
        oso_request("roles", {
          actor_type: actor_type, actor_id: actor_id, resource_type: resource_type, resource_id: resource_id
        }, :delete)
      end

      if create
        puts "CREATING"
        oso_request("roles", {
          actor_type: actor_type, actor_id: actor_id, resource_type: resource_type, resource_id: resource_id, name: name
        })
      end

      # return JSON.parse(res.body) if res.is_a?(Net::HTTPSuccess)
      # false
    end

    private

    def oso_request(path, data, method = :post)
      uri = URI("http://localhost:5002/#{path}")
      http = Net::HTTP.new(uri.host, uri.port)
      req = case method
      when :post
        Net::HTTP::Post.new(uri.path, 'Content-Type' => 'application/json')
      when :delete
        Net::HTTP::Delete.new(uri.path, 'Content-Type' => 'application/json')
      end
      req.body = data.to_json if data
      res = http.request(req)
      res
    end
  end
end
