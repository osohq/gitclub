class ApplicationController < ActionController::API
  def check_permission(action, resource)
    # TODO
  end

  # Sessions
  def current_user
    @current_user ||= begin
      return nil if session[:user_id].nil?
      User.find(session[:user_id])
    end
  end

  def current_user=(user)
    session[:user_id] = user&.id
    @current_user = user
  end
end
