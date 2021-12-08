class OrgRolesController < ApplicationController
  def unassigned_users
    org = Org.find(params[:id])
    authorize! "list_role_assignments", org
    assigned_users = User.includes(:org_roles).where({ org_roles: { org: org } })
    unassigned_users = User.where('id NOT IN (?)', assigned_users.map(&:id))

    render json: unassigned_users
  end

  def show
    org = Org.find(params[:id])
    authorize! "list_role_assignments", org
    roles = OrgRole.where(org: org).all

    render json: roles.map{|role| {user: role.user, role: role.name}}
  end

  def create
    org = Org.find(params[:id])
    authorize! "create_role_assignments", org
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)

    OrgRole.create(name: role, user: user, org: org)

    OSO.add_role(user, role, org)

    render json: {
      user: user,
      role: role
    }, status: 201
  end

  def update
    org = Org.find(params[:id])
    authorize! "update_role_assignments", org
    user_id = params.require(:user_id)
    user = User.find(user_id)
    role = params.require(:role)

    existing_role = OrgRole.find_by!(user: user, org: org)
    OSO.delete_role(user, existing_role.name, org)

    existing_role.update(name: role)
    OSO.add_role(user, role, org)

    render json: {
      user: user,
      role: role
    }
  end

  def destroy
    org = Org.find(params[:id])
    authorize! "delete_role_assignments", org
    user_id = params.require(:user_id)
    user = User.find(user_id)

    roles = OrgRole.destroy_by(user: user, org: org)
    roles.each do |role|
      OSO.delete_role(user, role.name, org)
    end

    head :no_content
  end
end
