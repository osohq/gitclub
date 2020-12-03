from .models import User, Organization, Team, Repository, Issue
from .models import RepositoryRole, OrganizationRole, TeamRole
from .models import RepositoryRoleEnum, OrganizationRoleEnum, TeamRoleEnum


def load_fixture_data(session):
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
    beatles = Organization(name="The Beatles", base_repo_role=RepositoryRoleEnum.READ)
    monsters = Organization(
        name="Monsters Inc.", base_repo_role=RepositoryRoleEnum.READ
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
    abby_road_read = RepositoryRole(
        name=RepositoryRoleEnum.READ,
        repository=abby_road,
        users=[john, paul],
        teams=[vocalists],
    )
    abby_road_triage = RepositoryRole(
        name=RepositoryRoleEnum.TRIAGE,
        repository=abby_road,
        users=[],
        teams=[],
    )
    abby_road_write = RepositoryRole(
        name=RepositoryRoleEnum.WRITE,
        repository=abby_road,
        users=[],
        teams=[],
    )
    abby_road_maintain = RepositoryRole(
        name=RepositoryRoleEnum.MAINTAIN,
        repository=abby_road,
        users=[],
        teams=[],
    )
    abby_road_admin = RepositoryRole(
        name=RepositoryRoleEnum.ADMIN,
        repository=abby_road,
        users=[],
        teams=[],
    )
    paperwork_read = RepositoryRole(
        name=RepositoryRoleEnum.READ,
        repository=paperwork,
        users=[john, paul],
        teams=[vocalists],
    )
    paperwork_triage = RepositoryRole(
        name=RepositoryRoleEnum.TRIAGE,
        repository=paperwork,
        users=[],
        teams=[],
    )
    paperwork_write = RepositoryRole(
        name=RepositoryRoleEnum.WRITE,
        repository=paperwork,
        users=[],
        teams=[],
    )
    paperwork_maintain = RepositoryRole(
        name=RepositoryRoleEnum.MAINTAIN,
        repository=paperwork,
        users=[],
        teams=[],
    )
    paperwork_admin = RepositoryRole(
        name=RepositoryRoleEnum.ADMIN,
        repository=paperwork,
        users=[],
        teams=[],
    )
    repo_roles = [
        abby_road_read,
        abby_road_triage,
        abby_road_write,
        abby_road_maintain,
        abby_road_admin,
        paperwork_read,
        paperwork_triage,
        paperwork_write,
        paperwork_maintain,
        paperwork_admin,
    ]
    for repo_role in repo_roles:
        session.add(repo_role)
    beatles_owner = OrganizationRole(
        name=OrganizationRoleEnum.OWNER,
        organization=beatles,
        users=[john],
    )
    beatles_member = OrganizationRole(
        name=OrganizationRoleEnum.MEMBER,
        organization=beatles,
        users=[paul, ringo],
    )
    monsters_owner = OrganizationRole(
        name=OrganizationRoleEnum.OWNER,
        organization=monsters,
        users=[mike],
    )
    monsters_member = OrganizationRole(
        name=OrganizationRoleEnum.MEMBER,
        organization=monsters,
        users=[sully, randall],
    )
    org_roles = [beatles_owner, beatles_member, monsters_owner, monsters_member]
    for org_role in org_roles:
        session.add(org_role)
    vocalists_member = TeamRole(name=TeamRoleEnum.MEMBER, team=vocalists, users=[paul])
    vocalists_maintainer = TeamRole(
        name=TeamRoleEnum.MAINTAINER, team=vocalists, users=[john]
    )
    percussion_member = TeamRole(name=TeamRoleEnum.MEMBER, team=percussion, users=[])
    percussion_maintainer = TeamRole(
        name=TeamRoleEnum.MAINTAINER, team=percussion, users=[ringo]
    )
    scarers_member = TeamRole(name=TeamRoleEnum.MEMBER, team=scarers, users=[randall])
    scarers_maintainer = TeamRole(
        name=TeamRoleEnum.MAINTAINER, team=scarers, users=[sully]
    )
    team_roles = [
        vocalists_member,
        vocalists_maintainer,
        percussion_member,
        percussion_maintainer,
        scarers_member,
        scarers_maintainer,
    ]
    for team_role in team_roles:
        session.add(team_role)

    session.commit()
