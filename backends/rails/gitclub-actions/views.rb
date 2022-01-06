def vertical_space
  # Design is my life
  "<div style='height: 20px;'></div>"
end

def horizontal_space
  "<div style='display: inline-block; width: 10px;'></div>"
end

def header_view(user)
  "<div>Logged in as: #{user.email}</div>"
end

def actions_view(user, repo)
  "Actions for repo #{repo.id}: " + repo.actions.map do |action|
    action_buttons = ["restart", "cancel"].map do |action_name|
    # action_buttons = (Set.new(["restart", "cancel"]) & OSO.authorized_actions(user, action)).map do |action_name|
      if OsoClient.is_allowed(user, action_name, action) then "<button>#{action_name.capitalize}</button>" else "" end
    end.join(" ")
    "<div>Action #{action.name}: #{action.status_html}#{horizontal_space}#{action_buttons}</div>"
  end.join("\n")
end

def footer_view
  "Log in as different users: <br />" +
  [1,2,4].map do |id|
    "<a href='/login/#{id}'><button>#{User.find(id).email}</button></a>"
  end.join(horizontal_space) +
  "<br /><br />" +
  "Authorization took #{OsoClient.get_duration.to_i}ms total<br />"
end

def actions_page(user, repo)
  header_view(user) +
  vertical_space +
  actions_view(user, repo) +
  vertical_space +
  footer_view
end

