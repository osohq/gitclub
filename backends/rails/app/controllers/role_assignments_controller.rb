class RoleAssignmentsController < ApplicationController
  def org_unassigned_users
    puts params

    render json: []
  end

  def org_index
    org = Org.find(params[:id])

    render json: []
  end

  def org_create
    org = Org.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)
    
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
    
    render json: {
      user: user,
      role: role
    }
  end

  def org_delete
    org = Org.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)
    
    head :no_content
  end

  def repo_unassigned_users
    puts params

    render json: []
  end

  def repo_index
    org = Org.find(params[:id])

    render json: []
  end

  def repo_create
    org = Org.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)
    
    render json: {
      user: user,
      role: role
    }, status: 201
  end

  def repo_update
    org = Org.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)
    
    render json: {
      user: user,
      role: role
    }
  end

  def repo_delete
    org = Org.find(params[:id])
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)
    
    head :no_content
  end
end