class ApplicationController < ActionController::API
  def check_permission(action, resource)
    # TODO
  end

  # Sessions
  def current_user
    puts session
    @current_user ||= begin
      return nil if session[:user_id].nil?
      User.find(session[:user_id])
    end
  end

  def current_user=(user)
    puts user
    session[:user_id] = user&.id
    puts session
    @current_user = user
  end
end
