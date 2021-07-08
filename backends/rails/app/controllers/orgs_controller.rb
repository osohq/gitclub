class OrgsController < ApplicationController
  def index
    orgs = Org.all
    # TODO: authz
    render json: orgs
  end

  def create
    org = Org.new(create_params)
    # TODO: authz
    org.save
    # TODO: assign user role to org
    render json: org, status: 201
  end

  def show
    org = Org.find(params[:id])
    # TODO: authz
    render json: org
  end

  private

  def create_params
    params.permit(:name, :base_repo_role, :billing_address)
  end
end
