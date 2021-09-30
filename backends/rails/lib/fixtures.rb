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

    too_much_critical_acclaim = Issue.create(title: "Too much critical acclaim", repo: abbey_road, creator: john)
    issues = [too_much_critical_acclaim]

    ##############
    # Repo roles #
    ##############

    # TODO

    RepoRole.create(user: john, repo: abbey_road, name: "reader")
    RepoRole.create(user: paul, repo: abbey_road, name: "reader")
    RepoRole.create(user: ringo, repo: abbey_road, name: "maintainer")
    RepoRole.create(user: mike, repo: paperwork, name: "reader")
    RepoRole.create(user: sully, repo: paperwork, name: "reader")

    # #############
    # # Org roles #
    # #############

    OrgRole.create(user: john, org: beatles, name: "owner")
    OrgRole.create(user: paul, org: beatles, name: "member")
    OrgRole.create(user: ringo, org: beatles, name: "member")
    OrgRole.create(user: mike, org: monsters, name: "owner")
    OrgRole.create(user: sully, org: monsters, name: "member")
    OrgRole.create(user: randall, org: monsters, name: "member")
  end
end
