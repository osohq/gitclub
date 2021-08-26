class UserReposController < ApplicationController
  def index
    user = User.find(params[:user_id])
    authorize! "read_profile", user
    repos = OSO.get_allowed_resources user, 'read', Repo

    render json: repos
  end
end
