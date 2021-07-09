Rails.application.routes.draw do
  resource :session, only: [:create, :show, :destroy]
  resources :orgs, only: [:create, :show, :index] do
    member do
      get :unassigned_users, to: 'role_assignments#org_unassigned_users'
      get :role_assignments, to: 'role_assignments#org_index'
      post :role_assignments, to: 'role_assignments#org_create'
      patch :role_assignments, to: 'role_assignments#org_update'
      delete :role_assignments, to: 'role_assignments#org_delete'
    end

    resources :repos, only: [:create, :index, :show] do
      resources :issues, only: [:index, :create, :show]
      
      member do
        get :unassigned_users, to: 'role_assignments#repo_unassigned_users'
        get :role_assignments, to: 'role_assignments#repo_index'
        post :role_assignments, to: 'role_assignments#repo_create'
        patch :role_assignments, to: 'role_assignments#repo_update'
        delete :role_assignments, to: 'role_assignments#repo_delete'
      end
    end
  end

  get :org_role_choices, to: 'role_choices#org_role_choices'
  get :repo_role_choices, to: 'role_choices#repo_role_choices'
end
