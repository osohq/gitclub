class ReposController < ApplicationController
  def index
    org = Org.find(params[:org_id])
    # TODO: authz
    render json: org.repos
  end

  def create
    org = Org.find(params[:org_id])
    repo = Repo.new(create_params.merge(org: org))
    # TODO: authz
    repo.save
    # TODO: assign user role to repo
    render json: repo, status: 201
  end

  def show
    repo = Repo.find(params[:id])
    # TODO: authz
    render json: repo
  end

  private

  def create_params
    params.permit(:name)
  end
end
