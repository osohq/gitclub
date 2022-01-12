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
  can_cancel = OsoClient.batch_is_allowed(user, "cancel", repo.actions)
  can_restart = OsoClient.batch_is_allowed(user, "restart", repo.actions)
  "Actions for repo #{repo.id}: " + repo.actions.each_with_index.map do |action, i|
    action_buttons = if can_restart[i] then "<button>Restart</button>" else "" end +
    if can_cancel[i] then "<button>Cancel</button>" else "" end
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

