from .models import User, Organization, Team, Repository, Issue
from .models import RepositoryRole, OrganizationRole, TeamRole


def load_fixture_data(session):
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
    beatles = Organization(
        name="The Beatles",
        billing_address="64 Penny Ln Liverpool, UK",
        base_repo_role="READ",
    )
    monsters = Organization(
        name="Monsters Inc.",
        billing_address="123 Scarers Rd Monstropolis, USA",
        base_repo_role="READ",
    )
    organizations = [beatles, monsters]
    for org in organizations:
        session.add(org)
    vocalists = Team(name="Vocalists", organization=beatles)
    percussion = Team(name="Percussion", organization=beatles)
    scarers = Team(name="Scarers", organization=monsters)
    teams = [
        vocalists,
        percussion,
        scarers,
    ]
    for team in teams:
        session.add(team)
    abby_road = Repository(name="Abbey Road", organization=beatles)
    paperwork = Repository(name="Paperwork", organization=monsters)
    repositories = [
        abby_road,
        paperwork,
    ]
    for repo in repositories:
        session.add(repo)
    # TODO: issues

    # CREATE ROLE DATA
    roles = [
        RepositoryRole(name="READ", repository=abby_road, user=john),
        RepositoryRole(name="READ", repository=abby_road, user=paul),
        RepositoryRole(name="WRITE", repository=abby_road, team=percussion),
        RepositoryRole(name="READ", repository=paperwork, user=mike),
        RepositoryRole(name="READ", repository=paperwork, user=sully),
        OrganizationRole(
            name="OWNER",
            organization=beatles,
            user=john,
        ),
        OrganizationRole(
            name="MEMBER",
            organization=beatles,
            user=paul,
        ),
        OrganizationRole(
            name="MEMBER",
            organization=beatles,
            user=ringo,
        ),
        OrganizationRole(
            name="OWNER",
            organization=monsters,
            user=mike,
        ),
        OrganizationRole(
            name="MEMBER",
            organization=monsters,
            user=sully,
        ),
        OrganizationRole(
            name="MEMBER",
            organization=monsters,
            user=randall,
        ),
        TeamRole(name="MEMBER", team=vocalists, user=paul),
        TeamRole(name="MAINTAINER", team=vocalists, user=john),
        TeamRole(name="MAINTAINER", team=percussion, user=ringo),
        TeamRole(name="MEMBER", team=scarers, user=randall),
        TeamRole(name="MAINTAINER", team=scarers, user=sully),
    ]

    for role in roles:
        session.add(role)

    session.commit()
