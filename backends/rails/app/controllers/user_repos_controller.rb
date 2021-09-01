class UserReposController < ApplicationController
  def index
    user = User.find(params[:user_id])
    authorize! "read_profile", user
    repos = OSO.authorized_resources user, 'read', Repo

    render json: repos
  end
end
