class IssuesController < ApplicationController
  def index
    repo = Repo.find(params[:repo_id])

    render json: repo.issues
  end

  def create
    repo = Repo.find(params[:repo_id])
    issue = Issue.new(create_params.merge(repo: repo))
    # TODO: authz
    issue.save
    # TODO: assign user role to org
    render json: issue, status: 201
  end

  def show
    issue = Issue.find(params[:id])
    # TODO: authz
    render json: issue
  end

  private

  def create_params
    params.permit(:title)
  end
end