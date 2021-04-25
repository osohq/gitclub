from sqlalchemy_oso.roles2 import OsoRoles

from .models import User, Org, Team, Repo


def load_fixture_data(session, roles: OsoRoles):
    # CREATE USER DATA
    john = User(email="john@beatles.com")
    paul = User(email="paul@beatles.com")
    admin = User(email="admin@admin.com")
    mike = User(email="mike@monsters.com")
    sully = User(email="sully@monsters.com")
    ringo = User(email="ringo@beatles.com")
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

    # CREATE RESOURCE DATA
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
    vocalists = Team(name="Vocalists", org=beatles)
    percussion = Team(name="Percussion", org=beatles)
    scarers = Team(name="Scarers", org=monsters)
    teams = [
        vocalists,
        percussion,
        scarers,
    ]
    for team in teams:
        session.add(team)
    abby_road = Repo(name="Abbey Road", org=beatles)
    paperwork = Repo(name="Paperwork", org=monsters)
    repos = [
        abby_road,
        paperwork,
    ]
    for repo in repos:
        session.add(repo)

    # TODO: issues

    # https://github.com/osohq/oso/blob/70965f2277d7167c38d3641140e6e97dec78e3bf/languages/python/sqlalchemy-oso/tests/test_roles2.py#L132-L133
    session.commit()

    # XXX(gj): it would be nice if `roles.assign_role()` had a `commit` kwarg
    # that defaulted to `False`, like the previous APIs. Don't always want to
    # commit on every single role assignment.

    # Repo roles
    roles.assign_role(john, abby_road, "repo_read", session=session)
    roles.assign_role(paul, abby_road, "repo_read", session=session)
    roles.assign_role(percussion, abby_road, "repo_write", session=session)
    roles.assign_role(mike, paperwork, "repo_read", session=session)
    roles.assign_role(sully, paperwork, "repo_read", session=session)

    # Org roles
    roles.assign_role(john, beatles, "org_owner", session=session)
    roles.assign_role(paul, beatles, "org_member", session=session)
    roles.assign_role(ringo, beatles, "org_member", session=session)
    roles.assign_role(mike, monsters, "org_owner", session=session)
    roles.assign_role(sully, monsters, "org_member", session=session)
    roles.assign_role(randall, monsters, "org_member", session=session)

    # # Team roles
    # roles.assign_role(paul, vocalists, "MEMBER", session=session)
    # roles.assign_role(john, vocalists, "MAINTAINER", session=session)
    # roles.assign_role(ringo, percussion, "MAINTAINER", session=session)
    # roles.assign_role(randall, scarers, "MEMBER", session=session)
    # roles.assign_role(sully, scarers, "MAINTAINER", session=session)
