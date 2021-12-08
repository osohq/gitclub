require_relative 'models'
require_relative 'oso_remote'
require_relative 'views'
require 'sinatra'
require 'sinatra/cookies'
require 'oso-oso'

set :show_exceptions, :after_handler
set :port, 5001

OSO = Oso::Oso.new
OSO.register_class(OsoRemote, name: "Oso")
OSO.register_class(User)
OSO.register_class(Repository)
OSO.register_class(Action)
OSO.load_files(['actions.polar'])

get '/login/:id' do
  # Demo purposes only: create a session cookie for a user
  Session.create(self, params[:id])
  user = Session.get_user(self)

  redirect "/repo/1/actions"
end

get '/repo/:repo_id/actions' do
  user = Session.get_user(self)
  repo = Repository.find(params[:repo_id])
  OSO.authorize(user, "list_actions", repo)

  actions_page(user, repo)
end

error Oso::NotFoundError do
  "Repository not found" + vertical_space + footer_view
end
