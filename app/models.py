import json
import datetime

from flask import current_app
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship, scoped_session

from sqlalchemy_oso.hooks import authorized_sessionmaker, make_authorized_query_cls
from sqlalchemy_utils.types.choice import ChoiceType

db = SQLAlchemy()

## TEXT CHOICES ##

RepositoryRoleLevel = [
    ("READ", "Read"),
    ("TRIAGE", "Triage"),
    ("WRITE", "Write"),
    ("MAINTAIN", "Maintain"),
    ("ADMIN", "Admin"),
]

OrganizationRoleLevel = [
    ("MEMBER", "Member"),
    ("BILLING_MANAGER", "Billing"),
    ("OWNER", "Owner"),
]

TeamRoleLevel = [
    ("MEMBER", "Member"),
    ("MAINTAINER", "Maintainer"),
]

## JOIN TABLES ##

repository_roles_users = db.Table(
    "repository_roles_users",
    db.Column(
        "repository_role_id",
        db.Integer,
        db.ForeignKey("repository_roles.id"),
        primary_key=True,
    ),
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
)

repository_roles_teams = db.Table(
    "repository_roles_teams",
    db.Column(
        "repository_role_id",
        db.Integer,
        db.ForeignKey("repository_roles.id"),
        primary_key=True,
    ),
    db.Column("team_id", db.Integer, db.ForeignKey("teams.id"), primary_key=True),
)

organization_roles_users = db.Table(
    "organization_roles_users",
    db.Column(
        "organization_role_id",
        db.Integer,
        db.ForeignKey("organization_roles.id"),
        primary_key=True,
    ),
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
)

team_roles_users = db.Table(
    "team_roles_users",
    db.Column(
        "team_role_id",
        db.Integer,
        db.ForeignKey("team_roles.id"),
        primary_key=True,
    ),
    db.Column("user_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
)

## MODELS ##


class Organization(db.Model):
    __tablename__ = "organizations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String())
    base_repo_role = db.Column(ChoiceType(RepositoryRoleLevel, impl=db.String()))

    def repr(self):
        return {"id": self.id, "name": self.name}


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String())

    def repr(self):
        return {"id": self.id, "email": self.email}


class Team(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256))

    # many-to-one relationship with organizations
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"))
    organization = db.relationship("Organization", backref="teams", lazy=True)

    def repr(self):
        return {"id": self.id, "name": self.name}


class Repository(db.Model):
    __tablename__ = "repositories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(256))

    # many-to-one relationship with organizations
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"))
    organization = db.relationship("Organization", backref="repositories", lazy=True)

    # time info
    created_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_date = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def repr(self):
        return {"id": self.id, "name": self.name}


class Issue(db.Model):
    __tablename__ = "issues"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(ChoiceType(RepositoryRoleLevel, impl=db.String()))
    repository_id = db.Column(db.Integer, db.ForeignKey("repositories.id"))
    repository = db.relationship("Repository", backref="issues", lazy=True)


## ROLE MODELS ##


class RepositoryRole(db.Model):
    __tablename__ = "repository_roles"

    id = db.Column(db.Integer, primary_key=True)

    # RepositoryRole name, selected from RepositoryRoleChoices
    name = db.Column(ChoiceType(RepositoryRoleLevel, impl=db.String()))

    # many-to-one relationship with repositories
    repository_id = db.Column(db.Integer, db.ForeignKey("repositories.id"))
    repository = db.relationship("Repository", backref="roles", lazy=True)

    # many-to-many relationship with users
    users = db.relationship(
        "User",
        secondary=repository_roles_users,
        lazy="subquery",
        backref=db.backref("repository_roles", lazy=True),
    )

    # many-to-many relationship with teams
    teams = db.relationship(
        "Team",
        secondary=repository_roles_teams,
        lazy="subquery",
        backref=db.backref("repository_roles", lazy=True),
    )

    def repr(self):
        return {"id": self.id, "name": self.name}


class OrganizationRole(db.Model):
    __tablename__ = "organization_roles"
    id = db.Column(db.Integer, primary_key=True)

    # OrganizationRole name, selected from OrganizationRoleLevel
    name = db.Column(ChoiceType(OrganizationRoleLevel, impl=db.String()))

    # many-to-one relationship with repositories
    organization_id = db.Column(db.Integer, db.ForeignKey("organizations.id"))
    organization = db.relationship("Organization", backref="roles", lazy=True)

    # many-to-many relationship with users
    users = db.relationship(
        "User",
        secondary=organization_roles_users,
        lazy="subquery",
        backref=db.backref("organization_roles", lazy=True),
    )

    def repr(self):
        return {"id": self.id, "name": self.name}


class TeamRole(db.Model):
    __tablename__ = "team_roles"
    id = db.Column(db.Integer, primary_key=True)

    # Role name, selected from role choices
    name = db.Column(ChoiceType(TeamRoleLevel, impl=db.String()))

    # many-to-one relationship with teams
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id"))
    team = db.relationship("Team", backref="roles", lazy=True)

    # many-to-many relationship with users
    users = db.relationship(
        "User",
        secondary=team_roles_users,
        lazy="subquery",
        backref=db.backref("team_roles", lazy=True),
    )

    def repr(self):
        return {"id": self.id, "name": self.name}
