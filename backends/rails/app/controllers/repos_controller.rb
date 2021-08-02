class ReposController < ApplicationController
  def index
    org = Org.find(params[:org_id])
    authorize! "list_repos", org

    render json: org.repos
  end

  def create
    org = Org.find(params[:org_id])
    repo = Repo.new(create_params.merge(org: org))
    authorize! "create_repos", org

    repo.save
    render json: repo, status: 201
  end

  def show
    repo = Repo.find(params[:id])
    authorize! "read", repo

    render json: repo
  end

  private

  def create_params
    params.permit(:name)
  end
end
