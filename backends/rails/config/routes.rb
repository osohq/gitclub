Rails.application.routes.draw do
  resource :session, only: [:create, :show, :destroy]
  resources :orgs, only: [:create, :show, :index]

  get '/org_role_choices', to: 'role_choices#org_role_choices'
  get '/repo_role_choices', to: 'role_choices#repo_role_choices'
end
