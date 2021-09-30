Rails.application.routes.draw do
  resource :session, only: [:create, :show, :destroy]
  resources :orgs, only: [:create, :show, :index] do
    member do
      get :unassigned_users, controller: "org_roles"
      resource :role_assignments, only: [:create, :show, :update, :destroy], controller: "org_roles"
    end

    resources :repos, only: [:create, :index, :show] do
      resources :issues, only: [:index, :create, :show] do
        member do
          put :close
        end
      end

      member do
        get :unassigned_users, controller: "repo_roles"
        resource :role_assignments, only: [:create, :show, :update, :destroy], controller: "repo_roles"
      end
    end
  end

  resources :users, only: [:show] do
    resources :repos, only: [:index], controller: "user_repos"
  end

  get :org_role_choices, to: 'role_choices#org_role_choices'
  get :repo_role_choices, to: 'role_choices#repo_role_choices'

  post '/_reset', to: 'test#reset'
end
