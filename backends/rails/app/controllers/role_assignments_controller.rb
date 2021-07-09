class RoleAssignmentsController < ApplicationController
  def org_unassigned_users
    puts params

    render json: []
  end

  def org_index
    org = Org.find(params[:id])
    roles = OrgRole.where(org: org).all

    render json: roles.map{|role| {user: role.user, role: role.name}}
  end

  def org_create
    org = Org.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)

    OrgRole.create(name: role, user: user, org: org)

    render json: {
      user: user,
      role: role
    }, status: 201
  end

  def org_update
    org = Org.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)

    existing_role = OrgRole.find_by!(user: user, org: org)
    existing_role.update(name: role)

    render json: {
      user: user,
      role: role
    }
  end

  def org_delete
    org = Org.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)

    OrgRole.destroy_by(user: user, org: org)
    
    head :no_content
  end

  def repo_unassigned_users
    puts params

    render json: []
  end

  def repo_index
    repo = Repo.find(params[:id])
    roles = RepoRole.where(repo: repo).all

    render json: roles.map{|role| {user: role.user, role: role.name}}
  end

  def repo_create
    repo = Repo.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)

    RepoRole.create(name: role, user: user, repo: repo)
    
    render json: {
      user: user,
      role: role
    }, status: 201
  end

  def repo_update
    repo = Repo.find(params[:id])
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

  def repo_delete
    repo = Repo.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)

    RepoRole.destroy_by(user: user, repo: repo)
    
    head :no_content
  end
end