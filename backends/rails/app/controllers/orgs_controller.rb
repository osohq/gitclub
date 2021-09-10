class OrgsController < ApplicationController
  def index
    render json: OSO.authorized_resources(current_user, 'read', Org)
  end

  def create
    raise Exceptions::Forbidden if current_user.nil?

    org = Org.new(create_params)
    authorize! "create", org
    org.save
    OrgRole.create! user: current_user, org: org, name: 'owner'
    render json: org, status: 201
  end

  def show
    org = Org.find(params[:id])
    authorize! "read", org
    render json: org
  end

  private

  def create_params
    params.permit(:name, :base_repo_role, :billing_address)
  end
end
