from .conftest import test_client, test_db_session

import pytest
import json

from app.models import User
from app.fixtures import (
    john_email as john,
    paul_email as paul,
    mike_email as mike,
    ringo_email as ringo,
)


def test_db_loads(test_db_session):
    just_john = test_db_session.query(User).filter_by(email=john).all()
    assert len(just_john) == 1


def test_user_sessions(test_client):
    resp = test_client.get("/session")
    assert resp.status_code == 200
    assert json.loads(resp.data) == None

    resp = test_client.post("/session", json={"email": john})
    assert resp.status_code == 201
    assert json.loads(resp.data).get("email") == john

    resp = test_client.get("/session")
    assert resp.status_code == 200
    assert json.loads(resp.data).get("email") == john

    resp = test_client.delete("/session")
    assert resp.status_code == 204

    resp = test_client.get("/session")
    assert resp.status_code == 200
    assert json.loads(resp.data) == None


def test_user_show(test_client):
    john_profile = "/users/1"
    resp = test_client.get(john_profile)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.get(john_profile)
    assert resp.status_code == 200
    assert json.loads(resp.data).get("email") == john

    test_client.log_in_as(paul)

    resp = test_client.get(john_profile)
    assert resp.status_code == 404


def test_org_index(test_client):
    resp = test_client.get("/orgs")
    assert resp.status_code == 200
    assert len(json.loads(resp.data)) == 0

    test_client.log_in_as(john)

    resp = test_client.get("/orgs")
    assert resp.status_code == 200
    orgs = json.loads(resp.data)
    assert len(orgs) == 1
    assert orgs[0]["name"] == "The Beatles"

    test_client.log_in_as(mike)

    resp = test_client.get("/orgs")
    assert resp.status_code == 200
    orgs = json.loads(resp.data)
    assert len(orgs) == 1
    assert orgs[0]["name"] == "Monsters Inc."


def test_org_create(test_client):
    org_name = "new org"
    org_params = {
        "name": org_name,
        "base_repo_role": "member",
        "billing_address": "123 whatever st",
    }
    resp = test_client.post("/orgs", json=org_params)
    assert resp.status_code == 403

    test_client.log_in_as(john)

    resp = test_client.post("/orgs", json=org_params)
    assert resp.status_code == 201
    org = json.loads(resp.data)
    assert org["name"] == org_name


def test_org_show(test_client):
    the_beatles = "/orgs/1"
    resp = test_client.get(the_beatles)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.get(the_beatles)
    assert resp.status_code == 200
    org = json.loads(resp.data)
    assert org["name"] == "The Beatles"

    test_client.log_in_as(mike)

    resp = test_client.get(the_beatles)
    assert resp.status_code == 404


def test_repo_role_choices_index(test_client):
    resp = test_client.get("/repo_role_choices")
    assert resp.status_code == 200
    repo_role_choices = json.loads(resp.data)
    assert len(repo_role_choices) == 3
    assert repo_role_choices[0] == "admin"


def test_org_role_choices_index(test_client):
    resp = test_client.get("/org_role_choices")
    assert resp.status_code == 200
    org_role_choices = json.loads(resp.data)
    assert org_role_choices == ["member", "owner"]


def test_org_unassigned_users_index(test_client):
    resp = test_client.get("/orgs/1/unassigned_users")
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.get("/orgs/1/unassigned_users")
    assert resp.status_code == 200
    unassigned_users = json.loads(resp.data)
    assert len(unassigned_users) == 4
    unassigned_emails = [u["email"] for u in unassigned_users]
    assert john not in unassigned_emails
    assert paul not in unassigned_emails
    assert mike in unassigned_emails


def test_repo_index(test_client):
    beatles_repos = "/orgs/1/repos"
    resp = test_client.get(beatles_repos)
    # cannot see org => cannot index repo
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.get(beatles_repos)
    assert resp.status_code == 200
    repos = json.loads(resp.data)
    assert len(repos) == 1
    assert repos[0]["name"] == "Abbey Road"

    test_client.log_in_as(mike)

    resp = test_client.get(beatles_repos)
    assert resp.status_code == 404


def test_repo_create(test_client):
    repo_params = {"name": "new repo"}
    beatles_repos = "/orgs/1/repos"
    resp = test_client.post(beatles_repos, json=repo_params)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.post(beatles_repos, json=repo_params)
    assert resp.status_code == 201
    repo = json.loads(resp.data)
    assert repo["name"] == repo_params["name"]

    monsters_repos = "/orgs/2/repos"
    resp = test_client.post(monsters_repos, json=repo_params)
    assert resp.status_code == 404


def test_repo_show(test_client):
    abbey_road = "/orgs/1/repos/1"
    resp = test_client.get(abbey_road)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.get(abbey_road)
    assert resp.status_code == 200
    repo = json.loads(resp.data)
    assert repo["name"] == "Abbey Road"

    test_client.log_in_as(mike)

    resp = test_client.get(abbey_road)
    assert resp.status_code == 404


def test_issue_index(test_client):
    abbey_road_issues = "/orgs/1/repos/1/issues"
    resp = test_client.get(abbey_road_issues)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.get(abbey_road_issues)
    assert resp.status_code == 200
    issues = json.loads(resp.data)
    assert len(issues) == 1
    assert issues[0]["title"] == "Too much critical acclaim"

    test_client.log_in_as(mike)

    resp = test_client.get(abbey_road_issues)
    assert resp.status_code == 404


def test_issue_create(test_client):
    issue_params = {"title": "new issue"}
    abbey_road_issues = "/orgs/1/repos/1/issues"
    resp = test_client.post(abbey_road_issues, json=issue_params)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.post(abbey_road_issues, json=issue_params)
    assert resp.status_code == 201
    issue = json.loads(resp.data)
    assert issue["title"] == issue_params["title"]

    paperwork_issues = "/orgs/2/repos/2/issues"
    resp = test_client.post(paperwork_issues, json=issue_params)
    assert resp.status_code == 404


def test_issue_show(test_client):
    too_much_critical_acclaim = "/orgs/1/repos/1/issues/1"
    resp = test_client.get(too_much_critical_acclaim)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.get(too_much_critical_acclaim)
    assert resp.status_code == 200
    issue = json.loads(resp.data)
    assert issue["title"] == "Too much critical acclaim"

    test_client.log_in_as(mike)

    resp = test_client.get(too_much_critical_acclaim)
    assert resp.status_code == 404


def test_org_role_assignment_index(test_client):
    beatles_roles = "/orgs/1/role_assignments"
    resp = test_client.get(beatles_roles)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    resp = test_client.get(beatles_roles)
    assert resp.status_code == 200
    roles = json.loads(resp.data)
    assert len(roles) == 3
    john_role = roles[0]
    assert john_role["user"]["email"] == john
    assert john_role["role"] == "owner"
    ringo_role = roles[2]
    assert ringo_role["user"]["email"] == ringo
    assert ringo_role["role"] == "member"

    test_client.log_in_as(mike)

    resp = test_client.get(beatles_roles)
    assert resp.status_code == 404


def test_org_role_assignment_create(test_client):
    mike_id = 4
    role_params = {"user_id": mike_id, "role": "member"}
    beatles_roles = "/orgs/1/role_assignments"

    # A guest cannot assign a role in any org.
    resp = test_client.post(beatles_roles, json=role_params)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    # John can assign a new role in the Beatles org.
    resp = test_client.post(beatles_roles, json=role_params)
    assert resp.status_code == 201
    user_role = json.loads(resp.data)
    assert user_role["user"]["email"] == mike
    assert user_role["role"] == role_params["role"]

    # But John can't assign a new role in the Monsters org.
    monsters_roles = "/orgs/2/role_assignments"
    resp = test_client.post(monsters_roles, json=role_params)
    assert resp.status_code == 404


def test_org_role_assignment_update(test_client):
    paul_id = 2
    role_params = {"user_id": paul_id, "role": "owner"}
    beatles_roles = "/orgs/1/role_assignments"

    # A guest cannot update a role in any org.
    resp = test_client.patch(beatles_roles, json=role_params)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    # Paul is currently an 'member' in the Beatles org.
    resp = test_client.get(beatles_roles)
    user_roles = json.loads(resp.data)
    paul_role = user_roles[1]
    assert paul_role["user"]["email"] == paul
    assert paul_role["role"] == "member"

    # John can update Paul's role in the Beatles org.
    resp = test_client.patch(beatles_roles, json=role_params)
    assert resp.status_code == 200
    user_role = json.loads(resp.data)
    assert user_role["user"]["email"] == paul
    assert user_role["role"] == role_params["role"]

    # And Paul is now an 'owner' in the Beatles org.
    resp = test_client.get(beatles_roles)
    user_roles = json.loads(resp.data)
    paul_role = next(
        (ur["role"] for ur in user_roles if ur["user"]["email"] == paul), None
    )
    assert paul_role == "owner"

    # But John can't update a role in the Monsters org.
    monsters_roles = "/orgs/2/role_assignments"
    resp = test_client.patch(monsters_roles, json=role_params)
    assert resp.status_code == 404


def test_org_role_assignment_delete(test_client):
    paul_id = 2
    paul_role_params = {"user_id": paul_id, "role": "member"}
    beatles_roles = "/orgs/1/role_assignments"

    # A guest cannot delete a role in any org.
    resp = test_client.delete(beatles_roles, json=paul_role_params)
    assert resp.status_code == 404

    test_client.log_in_as(john)

    # Paul is currently an 'member' in the Beatles org.
    resp = test_client.get(beatles_roles)
    user_roles = json.loads(resp.data)
    paul_role = user_roles[1]
    assert paul_role["user"]["email"] == paul
    assert paul_role["role"] == "member"

    # John can delete Paul's role in the Beatles org.
    resp = test_client.delete(beatles_roles, json=paul_role_params)
    assert resp.status_code == 204

    # And Paul no longer has a role in the Beatles org.
    resp = test_client.get(beatles_roles)
    user_roles = json.loads(resp.data)
    paul_role = next(
        (ur["role"] for ur in user_roles if ur["user"]["email"] == paul), None
    )
    assert paul_role is None

    # And John can't delete a role in the Monsters org.
    sully_id = 5
    sully_role_params = {"user_id": sully_id}
    monsters_roles = "/orgs/2/role_assignments"
    resp = test_client.delete(monsters_roles, json=sully_role_params)
    assert resp.status_code == 404
