# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Examples:
#
#   movies = Movie.create([{ name: 'Star Wars' }, { name: 'Lord of the Rings' }])
#   Character.create(name: 'Luke', movie: movies.first)

require 'fixtures'

# Delete everything from database
OrgRole.destroy_all
RepoRole.destroy_all
Issue.destroy_all
Repo.destroy_all
Org.destroy_all
User.destroy_all

Fixtures.load_fixture_data()
