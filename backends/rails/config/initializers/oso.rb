# TODO: there must be a better way to do this :(
def load_oso
  oso = Oso.new
  # TODO: do this automatically with a module or something?
  # Unfortunately we're not guaranteed to have loaded those classes yet though
  oso_classes = [
    User,
    Org,
    Repo,
    Issue
  ]
  oso_classes.each do |klass|
    oso.register_class(klass)
  end

  puts "Reloading Oso"

  oso.load_file("app/policy/authorization.polar")
  oso.enable_roles()

  # This should be illegal
  Object.instance_eval { remove_const(:OSO) } if defined? OSO
  Object.const_set(:OSO, oso)
end

# Used in production, run once
load_oso

# module OsoRails
#   class Railtie < ::Rails::Railtie
#     # Used in development, run every time there is a code change
#     config.to_prepare do
#       load_oso
#     end
#   end
# end