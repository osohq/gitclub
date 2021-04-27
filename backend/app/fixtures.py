from sqlalchemy_oso.roles2 import OsoRoles

from .models import Issue, Org, Repo, User

john_email = "john@beatles.com"
paul_email = "paul@beatles.com"
mike_email = "mike@monsters.com"
ringo_email = "ringo@beatles.com"


def load_fixture_data(session, roles: OsoRoles):
    #########
    # Users #
    #########

    john = User(email=john_email)
    paul = User(email=paul_email)
    admin = User(email="admin@admin.com")
    mike = User(email=mike_email)
    sully = User(email="sully@monsters.com")
    ringo = User(email=ringo_email)
    randall = User(email="randall@monsters.com")
    users = [
        john,
        paul,
        admin,
        mike,
        sully,
        ringo,
        randall,
    ]
    for user in users:
        session.add(user)

    ########
    # Orgs #
    ########

    beatles = Org(
        name="The Beatles",
        billing_address="64 Penny Ln Liverpool, UK",
        base_repo_role="repo_read",
    )
    monsters = Org(
        name="Monsters Inc.",
        billing_address="123 Scarers Rd Monstropolis, USA",
        base_repo_role="repo_read",
    )
    orgs = [beatles, monsters]
    for org in orgs:
        session.add(org)

    #########
    # Repos #
    #########

    abby_road = Repo(name="Abbey Road", org=beatles)
    paperwork = Repo(name="Paperwork", org=monsters)
    repos = [abby_road, paperwork]
    for repo in repos:
        session.add(repo)

    ##########
    # Issues #
    ##########

    too_much_critical_acclaim = Issue(title="Too much critical acclaim", repo=abby_road)
    issues = [too_much_critical_acclaim]
    for issue in issues:
        session.add(issue)

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles2.py#L132-L133
    session.flush()

    ##############
    # Repo roles #
    ##############

    roles.assign_role(john, abby_road, "repo_read", session=session)
    roles.assign_role(paul, abby_road, "repo_read", session=session)
    roles.assign_role(ringo, abby_road, "repo_write", session=session)
    roles.assign_role(mike, paperwork, "repo_read", session=session)
    roles.assign_role(sully, paperwork, "repo_read", session=session)

    #############
    # Org roles #
    #############

    roles.assign_role(john, beatles, "org_owner", session=session)
    roles.assign_role(paul, beatles, "org_member", session=session)
    roles.assign_role(ringo, beatles, "org_member", session=session)
    roles.assign_role(mike, monsters, "org_owner", session=session)
    roles.assign_role(sully, monsters, "org_member", session=session)
    roles.assign_role(randall, monsters, "org_member", session=session)

    session.commit()
