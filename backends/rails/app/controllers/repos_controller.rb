class ReposController < ApplicationController
  def index
    org = Org.find(params[:org_id])
    authorize! "list_repos", org
    # FIXME this isn't ideal but the current data filtering api is very rigid
    # we'd like to be able to ask "what repos can this org show this user"
    repos = OSO.get_allowed_resources(org, 'read', Repo)

    render json: repos
  end

  def create
    org = Org.find(params[:org_id])
    repo = Repo.new(create_params.merge(org: org))
    authorize! "create_repos", org

    repo.save
    RepoRole.create! user: current_user, repo: repo, name: org.base_repo_role
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
