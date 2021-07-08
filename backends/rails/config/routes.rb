Rails.application.routes.draw do
  resource :session, only: [:create, :show, :destroy]
  resources :orgs, only: [:create, :show, :index]
end
