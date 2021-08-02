require 'exceptions'

class ApplicationController < ActionController::API
  rescue_from Exceptions::NotFound, with: :render_not_found
  rescue_from Exceptions::Forbidden, with: :render_forbidden

  def authorize!(action, resource, error=Exceptions::NotFound)
    raise error unless OSO.allowed?(actor: current_user, action: action, resource: resource)
  end

  # Sessions
  def current_user
    @current_user ||= begin
      return nil if session[:user_id].nil?
      User.find_by_id(session[:user_id])
    end
  end

  def current_user=(user)
    session[:user_id] = user&.id
    @current_user = user
  end

  def render_not_found
    render json: {error: "Not found"}, status: 404
  end

  def render_forbidden
    render json: {error: "Forbidden"}, status: 403
  end
end
