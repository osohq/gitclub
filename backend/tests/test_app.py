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
    # John can read the repo because he has the "READ" role on it
    resp = test_client.get(
        "/orgs/1/repos/1/issues", headers={"user": "john@beatles.com"}
    )
    assert resp.status_code == 200

    # Ringo can read the repo because his team has the "WRITE" role on it
    resp = test_client.get(
        "/orgs/1/repos/1/issues", headers={"user": "ringo@beatles.com"}
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
    assert len(roles) == 3
    roles.sort(key=lambda x: x.get("user").get("email"))
    assert roles[0].get("user").get("email") == "john@beatles.com"
    assert roles[1].get("team").get("name") == "Percussion"
    assert roles[2].get("user").get("email") == "paul@beatles.com"

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
    assert len(roles) == 4
    assert roles[3].get("user").get("email") == "ringo@beatles.com"
    assert roles[3].get("role").get("name") == "WRITE"


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


def test_billing_show(test_client):
    resp = test_client.get("/orgs/1/billing", headers={"user": "john@beatles.com"})
    assert resp.status_code == 200

    resp = test_client.get("/orgs/1/billing", headers={"user": "paul@beatles.com"})
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
