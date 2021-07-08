module Fixtures
  JOHN_EMAIL = "john@beatles.com"
  PAUL_EMAIL = "paul@beatles.com"
  MIKE_EMAIL = "mike@monsters.com"
  RINGO_EMAIL = "ringo@beatles.com"
  
  def self.load_fixture_data
    #########
    # Users #
    #########
  
    john = User.create(email: JOHN_EMAIL)
    paul = User.create(email: PAUL_EMAIL)
    admin = User.create(email: "admin@admin.com")
    mike = User.create(email: MIKE_EMAIL)
    sully = User.create(email: "sully@monsters.com")
    ringo = User.create(email: RINGO_EMAIL)
    randall = User.create(email: "randall@monsters.com")
    users = [
      john,
      paul,
      admin,
      mike,
      sully,
      ringo,
      randall,
    ]
  
    ########
    # Orgs #
    ########
  
    beatles = Org.create(
      name: "The Beatles",
      billing_address: "64 Penny Ln Liverpool, UK",
      base_repo_role: "reader",
    )
    monsters = Org.create(
      name: "Monsters Inc.",
      billing_address: "123 Scarers Rd Monstropolis, USA",
      base_repo_role: "reader",
    )
    orgs = [beatles, monsters]
  
    #########
    # Repos #
    #########
  
    abbey_road = Repo.create(name: "Abbey Road", org: beatles)
    paperwork = Repo.create(name: "Paperwork", org: monsters)
    repos = [abbey_road, paperwork]
    
    ##########
    # Issues #
    ##########
  
    too_much_critical_acclaim = Issue.create(title: "Too much critical acclaim", repo: abbey_road)
    issues = [too_much_critical_acclaim]
  
    ##############
    # Repo roles #
    ##############
  
    # TODO
  
    # roles.assign_role(john, abbey_road, "reader", session=session)
    # roles.assign_role(paul, abbey_road, "reader", session=session)
    # roles.assign_role(ringo, abbey_road, "writer", session=session)
    # roles.assign_role(mike, paperwork, "reader", session=session)
    # roles.assign_role(sully, paperwork, "reader", session=session)
  
    # #############
    # # Org roles #
    # #############
  
    # roles.assign_role(john, beatles, "owner", session=session)
    # roles.assign_role(paul, beatles, "member", session=session)
    # roles.assign_role(ringo, beatles, "member", session=session)
    # roles.assign_role(mike, monsters, "owner", session=session)
    # roles.assign_role(sully, monsters, "member", session=session)
    # roles.assign_role(randall, monsters, "member", session=session)
  end
end