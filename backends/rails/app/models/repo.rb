require 'fetcher'
class Repo < ApplicationRecord
  include Fetcher
  belongs_to :org

  has_many :issues

  after_commit :update_relation

  def update_relation
    oso_request("relations", {
      subject_type: "Org",
      subject_id: self.org_id,
      predicate: "parent",
      object_type: "Repo",
      object_id: self.id
    })
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
