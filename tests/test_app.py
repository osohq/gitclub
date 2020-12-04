from .conftest import test_client, test_db_session
from flask import json

from app.models import User


def test_db_loads(test_db_session):
    just_john = (
        test_db_session.query(User).filter(User.email == "john@beatles.com").all()
    )
    assert len(just_john) == 1


def test_user(test_client):
    resp = test_client.get("/whoami")
    assert resp.status_code == 401

    resp = test_client.get("/whoami", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200
    assert json.loads(resp.data).get("email") == "john@beatles.com"


def test_orgs(test_client):
    resp = test_client.get("/orgs", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200

    orgs = json.loads(resp.data).get("orgs")
    assert len(orgs) == 1
    assert orgs[0]["id"] == 1

    resp = test_client.get("/orgs", headers={"user": "mike@monsters.com"})
    assert resp.status_code == 200

    orgs = json.loads(resp.data).get("orgs")
    assert len(orgs) == 1
    assert orgs[0]["id"] == 2


def test_repos_index(test_client):
    resp = test_client.get("/orgs/1/repos", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200

    repos = json.loads(resp.data).get("repos")
    assert len(repos) == 1
    assert repos[0]["id"] == 1

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
    resp = test_client.get(
        "/orgs/1/repos/1/roles", headers={"user": "john@beatles.com"}
    )
    assert resp.status_code == 200

    resp = test_client.get(
        "/orgs/1/repos/1/roles", headers={"user": "paul@beatles.com"}
    )
    assert resp.status_code == 403


## MUST ADD AUTHZ TESTING BELOW THIS LINE


def test_teams(test_client):
    resp = test_client.get("/orgs/1/teams", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200


def test_team(test_client):
    resp = test_client.get("/orgs/1/teams/1", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200


def test_org_roles(test_client):
    resp = test_client.get("/orgs/1/roles", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200


## TEST ROLE HELPERS ##


def test_get_user_organizations(test_client):
    pass
