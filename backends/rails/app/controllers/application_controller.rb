class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found

  def authorize!(action, resource)
    raise ActiveRecord::RecordNotFound unless OSO.allowed?(actor: current_user, action: action.to_s, resource: resource)
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
end
