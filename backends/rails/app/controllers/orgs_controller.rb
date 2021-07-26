class OrgsController < ApplicationController
  def index
    orgs = Org.all
    orgs = orgs.filter { |org| OSO.allowed?(actor: current_user, action: "read", resource: org) }
    render json: orgs
  end

  def create
    org = Org.new(create_params)
    authorize! "create", org, Exceptions::Forbidden
    org.save
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
