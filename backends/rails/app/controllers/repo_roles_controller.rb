class RepoRolesController < ApplicationController
  def unassigned_users
    repo = Repo.find(params[:id])
    assigned_users = User.includes(:repo_roles).where({ repo_roles: { repo: repo } })
    unassigned_users = User.where('id NOT IN (?)', assigned_users.map(&:id))
    authorize! :list_role_assignments, repo

    render json: unassigned_users
  end

  def show
    repo = Repo.find(params[:id])
    roles = RepoRole.where(repo: repo).all
    authorize! :list_role_assignments, repo

    render json: roles.map{|role| {user: role.user, role: role.name}}
  end

  def create
    repo = Repo.find(params[:id])
    authorize! :create_role_assignments, repo
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)

    RepoRole.create(name: role, user: user, repo: repo)

    render json: {
      user: user,
      role: role
    }, status: 201
  end

  def update
    repo = Repo.find(params[:id])
    authorize! "update_role_assignments", repo
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)

    existing_role = RepoRole.find_by!(user: user, repo: repo)
    existing_role.update(name: role)

    render json: {
      user: user,
      role: role
    }
  end

  def destroy
    repo = Repo.find(params[:id])
    authorize! "delete_role_assignments", repo
    user_id = params.require(:user_id)
    user = User.find(user_id)

    RepoRole.destroy_by(user: user, repo: repo)

    head :no_content
  end
end
