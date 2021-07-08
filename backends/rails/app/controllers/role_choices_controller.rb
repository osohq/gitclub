class RoleChoicesController < ApplicationController
  def org_role_choices
    # TODO: dynamic roles?
    render json: ["owner", "member"]
  end

  def repo_role_choices
    # TODO: dynamic roles?
    render json: ["admin", "writer", "reader"]
  end
end