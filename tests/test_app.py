from .conftest import test_client, test_db_session
from flask import json
import pytest

from app.models import User


def test_db_loads(test_db_session):
    just_john = (
        test_db_session.query(User).filter(User.email == "john@beatles.com").all()
    )
    assert len(just_john) == 1


def test_user(test_client):
    resp = test_client.get("/")
    assert resp.status_code == 401

    resp = test_client.get("/", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200
    assert json.loads(resp.data).get("email") == "john@beatles.com"


def test_orgs(test_client):
    resp = test_client.get("/orgs", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200

    orgs = json.loads(resp.data).get("orgs")
    assert len(orgs) == 1
    assert orgs[0]["name"] == "The Beatles"

    resp = test_client.get("/orgs", headers={"user": "mike@monsters.com"})
    assert resp.status_code == 200

    orgs = json.loads(resp.data).get("orgs")
    assert len(orgs) == 1
    assert orgs[0]["name"] == "Monsters Inc."


def test_repos_index(test_client):
    resp = test_client.get("/orgs/1/repos", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200

    repos = json.loads(resp.data).get("repos")
    assert len(repos) == 1
    assert repos[0]["name"] == "Abbey Road"

    resp = test_client.get("/orgs/2/repos", headers={"user": "john@beatles.com"})
    assert resp.status_code == 403


def test_repos_new(test_client):
    resp = test_client.post(
        "/orgs/1/repos",
        headers={"user": "john@beatles.com"},
        json={"name": "White Album"},
    )
    assert resp.status_code == 200

    resp = test_client.post(
        "/orgs/2/repos",
        headers={"user": "john@beatles.com"},
        json={"name": "White Album"},
    )
    assert resp.status_code == 403


def test_repos_show(test_client):
    # test user with direct access to repo can read it
    resp = test_client.get("/orgs/1/repos/1", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200

    # test user with org base role access to repo can read it
    resp = test_client.get("/orgs/1/repos/1", headers={"user": "ringo@beatles.com"})
    assert resp.status_code == 200

    # test user outside org cannot read repos
    resp = test_client.get("/orgs/2/repos/2", headers={"user": "john@beatles.com"})
    assert resp.status_code == 403


def test_issues_index(test_client):
    resp = test_client.get(
        "/orgs/1/repos/1/issues", headers={"user": "john@beatles.com"}
    )
    assert resp.status_code == 200

    resp = test_client.get(
        "/orgs/2/repos/2/issues", headers={"user": "john@beatles.com"}
    )
    assert resp.status_code == 403

    # TODO: add issues to fixtures to test list filtering


def test_repo_roles(test_client):
    # Test getting roles
    resp = test_client.get(
        "/orgs/1/repos/1/roles", headers={"user": "john@beatles.com"}
    )
    roles = json.loads(resp.data).get("roles")
    assert resp.status_code == 200
    assert len(roles) == 2
    assert roles[0].get("user").get("email") == "john@beatles.com"
    assert roles[1].get("user").get("email") == "paul@beatles.com"

    resp = test_client.get(
        "/orgs/1/repos/1/roles", headers={"user": "paul@beatles.com"}
    )
    assert resp.status_code == 403

    # Test editing roles
    resp = test_client.post(
        "/orgs/1/repos/1/roles",
        headers={"user": "john@beatles.com"},
        json={
            "role": {"name": "WRITE", "user": "ringo@beatles.com"},
        },
    )
    assert resp.status_code == 200

    resp = test_client.get(
        "/orgs/1/repos/1/roles", headers={"user": "john@beatles.com"}
    )
    assert resp.status_code == 200
    roles = json.loads(resp.data).get("roles")
    assert len(roles) == 3
    assert roles[2].get("user").get("email") == "ringo@beatles.com"
    assert roles[2].get("role").get("name") == "WRITE"


def test_teams(test_client):
    resp = test_client.get("/orgs/1/teams", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200

    resp = test_client.get("/orgs/1/teams", headers={"user": "paul@beatles.com"})
    assert resp.status_code == 200

    resp = test_client.get("/orgs/2/teams", headers={"user": "john@beatles.com"})
    assert resp.status_code == 403


def test_team(test_client):
    resp = test_client.get("/orgs/1/teams/1", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200

    resp = test_client.get("/orgs/1/teams/1", headers={"user": "paul@beatles.com"})
    assert resp.status_code == 200

    resp = test_client.get("/orgs/1/teams/1", headers={"user": "ringo@beatles.com"})
    assert resp.status_code == 403

    resp = test_client.get("/orgs/1/teams/3", headers={"user": "paul@beatles.com"})
    assert resp.status_code == 403


def test_org_roles(test_client):
    resp = test_client.get("/orgs/1/roles", headers={"user": "john@beatles.com"})
    roles = json.loads(resp.data).get("roles")
    assert resp.status_code == 200
    assert len(roles) == 3
    assert roles[0].get("user").get("email") == "john@beatles.com"
    assert roles[1].get("user").get("email") == "paul@beatles.com"
    assert roles[2].get("user").get("email") == "ringo@beatles.com"

    resp = test_client.get("/orgs/1/roles", headers={"user": "paul@beatles.com"})
    assert resp.status_code == 403

    resp = test_client.get("/orgs/2/roles", headers={"user": "john@beatles.com"})
    assert resp.status_code == 403


## TEST ROLE HELPERS ##

# from app import roles
from app.models import Organization, Team, Repository

from sqlalchemy_oso import roles as oso_roles


def test_get_user_resources_and_roles(test_db_session):
    john = test_db_session.query(User).filter_by(email="john@beatles.com").first()
    resource_roles = oso_roles.get_user_resources_and_roles(
        test_db_session, john, Organization
    )
    assert len(resource_roles) == 1
    assert resource_roles[0][0].name == "The Beatles"
    assert resource_roles[0][1].name == "OWNER"


def test_get_user_roles_for_resource(test_db_session):
    john = test_db_session.query(User).filter_by(email="john@beatles.com").first()
    beatles = test_db_session.query(Organization).filter_by(name="The Beatles").first()
    resource_roles = oso_roles.get_user_roles_for_resource(
        test_db_session, john, beatles
    )
    assert len(resource_roles) == 1
    assert resource_roles[0].name == "OWNER"


def test_get_group_resources_and_roles(test_db_session):
    vocalists = test_db_session.query(Team).filter_by(name="Vocalists").first()
    resource_roles = oso_roles.get_group_resources_and_roles(
        test_db_session, vocalists, Repository
    )
    assert len(resource_roles) == 1
    assert resource_roles[0][0].name == "Abbey Road"
    assert resource_roles[0][1].name == "READ"


def test_get_resource_users_and_roles(test_db_session):
    abbey_road = test_db_session.query(Repository).filter_by(name="Abbey Road").first()
    users = oso_roles.get_resource_users_and_roles(test_db_session, abbey_road)
    assert len(users)
    assert users[0][0].email == "john@beatles.com"
    assert users[0][1].name == "READ"
    assert users[1][0].email == "paul@beatles.com"
    assert users[0][1].name == "READ"


def test_get_resource_users_with_role(test_db_session):
    abbey_road = test_db_session.query(Repository).filter_by(name="Abbey Road").first()
    users = oso_roles.get_resource_users_with_role(test_db_session, abbey_road, "READ")
    assert len(users) == 2
    assert users[0].email == "john@beatles.com"
    assert users[1].email == "paul@beatles.com"


def test_add_user_role(test_db_session):
    ringo = test_db_session.query(User).filter_by(email="ringo@beatles.com").first()
    abbey_road = test_db_session.query(Repository).filter_by(name="Abbey Road").first()

    roles = oso_roles.get_user_roles_for_resource(test_db_session, ringo, abbey_road)
    assert len(roles) == 0

    oso_roles.add_user_role(test_db_session, ringo, abbey_road, "READ")

    roles = oso_roles.get_user_roles_for_resource(test_db_session, ringo, abbey_road)
    assert len(roles) == 1
    assert roles[0].name == "READ"


def test_delete_user_role(test_db_session):
    # Test with explicit role arg
    john = test_db_session.query(User).filter_by(email="john@beatles.com").first()
    abbey_road = test_db_session.query(Repository).filter_by(name="Abbey Road").first()

    roles = oso_roles.get_user_roles_for_resource(test_db_session, john, abbey_road)
    assert len(roles) == 1

    oso_roles.delete_user_role(test_db_session, john, abbey_road, "READ")

    roles = oso_roles.get_user_roles_for_resource(test_db_session, john, abbey_road)
    assert len(roles) == 0

    # Test without explicit role arg
    paul = test_db_session.query(User).filter_by(email="paul@beatles.com").first()
    roles = oso_roles.get_user_roles_for_resource(test_db_session, paul, abbey_road)
    assert len(roles) == 1

    oso_roles.delete_user_role(test_db_session, paul, abbey_road)

    roles = oso_roles.get_user_roles_for_resource(test_db_session, paul, abbey_road)
    assert len(roles) == 0

    # Test trying to delete non-existent role raises exception
    with pytest.raises(Exception):
        oso_roles.delete_user_role(test_db_session, paul, abbey_road, "READ")


def test_reassign_user_role(test_db_session):
    john = test_db_session.query(User).filter_by(email="john@beatles.com").first()
    abbey_road = test_db_session.query(Repository).filter_by(name="Abbey Road").first()

    roles = oso_roles.get_user_roles_for_resource(test_db_session, john, abbey_road)
    assert len(roles) == 1
    assert roles[0].name == "READ"

    oso_roles.reassign_user_role(test_db_session, john, abbey_road, "WRITE")

    roles = oso_roles.get_user_roles_for_resource(test_db_session, john, abbey_road)
    assert len(roles) == 1
    assert roles[0].name == "WRITE"