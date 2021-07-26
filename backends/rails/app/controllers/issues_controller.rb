class IssuesController < ApplicationController
  def index
    repo = Repo.find(params[:repo_id])
    authorize! "list_issues", repo
    render json: repo.issues
  end

  def create
    repo = Repo.find(params[:repo_id])
    issue = Issue.new(create_params.merge(repo: repo))
    authorize! "create_issues", repo
    issue.save
    render json: issue, status: 201
  end

  def show
    issue = Issue.find(params[:id])
    authorize! "read", issue
    render json: issue
  end

  private

  def create_params
    params.permit(:title)
  end
end
