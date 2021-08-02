class SessionsController < ApplicationController
  def show
    render json: current_user
  end

  def create
    raise ActionController::BadRequest.new() if params[:email].blank?

    self.current_user = User.find_by(email: params[:email])

    raise ActionController::RoutingError.new('Not Found') if current_user.nil?

    render json: current_user, status: 201
  end

  def destroy
    self.current_user = nil

    head :no_content
  end
end
