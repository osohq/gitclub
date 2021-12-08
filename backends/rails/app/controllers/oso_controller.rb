class OsoController < ApplicationController
  def check
    user_id = params[:user_id]
    role_name = params[:role_name]
    resource_id = params[:resource_id]

    user = User.find(user_id)
    resource = Repo.find(resource_id)

    render json: OSO.query_rule_once("has_role", user, role_name, resource)
  end
end
