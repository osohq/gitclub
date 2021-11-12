class IssuesController < ApplicationController
  def index
    repo = Repo.find(params[:repo_id])
    authorize! "list_issues", repo
    render json: repo.issues
  end

  def create
    repo = Repo.find(params[:repo_id])
    issue = Issue.new(create_params.merge(repo: repo, creator: current_user))
    authorize! "create_issues", repo
    issue.save
    render json: issue, status: 201
  end

  def show
    p Issue.all.to_a
    issue = Issue.find(params[:id])
    authorize! "read", issue
    render json: issue
  end

  def close
    issue = Issue.find(params[:id])
    authorize! "close", issue
    issue.closed = true
    issue.save
    render json: issue
  end

  private

  def create_params
    params.permit(:title)
  end
end
