class RoleChoicesController < ApplicationController
  def org_role_choices
    # TODO: dynamic roles?
    render json: ["member", "owner"]
  end

  def repo_role_choices
    # TODO: dynamic roles?
    render json: ["admin", "maintainer", "reader"]
  end
end
