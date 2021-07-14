OSO = Oso.new

# TODO: do this automatically with a module or something?
# Unfortunately we're not guaranteed to have loaded those classes yet though
[
  User,
  Org,
  Repo,
  Issue
].each do |klass|
  OSO.register_class(klass)
end

OSO.load_file("app/policy/authorization.polar")
OSO.enable_roles()
