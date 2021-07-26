class UsersController < ApplicationController
  def show
    user = User.find(params[:id])
    authorize! "read_profile", user
    render json: user
  end
end
