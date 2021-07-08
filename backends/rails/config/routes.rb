Rails.application.routes.draw do
  resource :session, only: [:create, :show, :destroy]
end
