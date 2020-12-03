import json
import datetime
from enum import Enum

from flask import current_app
from flask_sqlalchemy import SQLAlchemy

from sqlalchemy.types import Integer, String, DateTime
from sqlalchemy.schema import Table, Column, ForeignKey
from sqlalchemy.orm import relationship, scoped_session, backref

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy_oso.hooks import authorized_sessionmaker, make_authorized_query_cls
from sqlalchemy_utils.types.choice import ChoiceType


class RepositoryRoleEnum(Enum):
    READ = 1
    TRIAGE = 2
    WRITE = 3
    MAINTAIN = 4
    ADMIN = 5


class OrganizationRoleEnum(Enum):
    OWNER = 1
    MEMBER = 2
    BILLING = 3


class TeamRoleEnum(Enum):
    MEMBER = 1
    MAINTAINER = 2


Base = declarative_base()

## JOIN TABLES ##

repository_roles_users = Table(
    "repository_roles_users",
    Base.metadata,
    Column(
        "repository_role_id",
        Integer,
        ForeignKey("repository_roles.id"),
        primary_key=True,
    ),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)

repository_roles_teams = Table(
    "repository_roles_teams",
    Base.metadata,
    Column(
        "repository_role_id",
        Integer,
        ForeignKey("repository_roles.id"),
        primary_key=True,
    ),
    Column("team_id", Integer, ForeignKey("teams.id"), primary_key=True),
)

organization_roles_users = Table(
    "organization_roles_users",
    Base.metadata,
    Column(
        "organization_role_id",
        Integer,
        ForeignKey("organization_roles.id"),
        primary_key=True,
    ),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)

team_roles_users = Table(
    "team_roles_users",
    Base.metadata,
    Column(
        "team_role_id",
        Integer,
        ForeignKey("team_roles.id"),
        primary_key=True,
    ),
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
)

## MODELS ##


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True)
    name = Column(String())
    base_repo_role = Column(ChoiceType(RepositoryRoleEnum, impl=Integer()))

    def repr(self):
        return {"id": self.id, "name": self.name}


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String())

    def repr(self):
        return {"id": self.id, "email": self.email}


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))

    # many-to-one relationship with organizations
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    organization = relationship("Organization", backref="teams", lazy=True)

    def repr(self):
        return {"id": self.id, "name": self.name}


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))

    # many-to-one relationship with organizations
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    organization = relationship("Organization", backref="repositories", lazy=True)

    # time info
    created_date = Column(DateTime, default=datetime.datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.datetime.utcnow)

    def repr(self):
        return {"id": self.id, "name": self.name}


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    repository = relationship("Repository", backref="issues", lazy=True)


## ROLE MODELS ##


class RepositoryRole(Base):
    __tablename__ = "repository_roles"

    id = Column(Integer, primary_key=True)

    # RepositoryRole name, selected from RepositoryRoleChoices
    name = Column(ChoiceType(RepositoryRoleEnum, impl=Integer()))

    # many-to-one relationship with repositories
    repository_id = Column(Integer, ForeignKey("repositories.id"))
    repository = relationship("Repository", backref="roles", lazy=True)

    # many-to-many relationship with users
    users = relationship(
        "User",
        secondary=repository_roles_users,
        lazy="subquery",
        backref=backref("repository_roles", lazy=True),
    )

    # many-to-many relationship with teams
    teams = relationship(
        "Team",
        secondary=repository_roles_teams,
        lazy="subquery",
        backref=backref("repository_roles", lazy=True),
    )

    def repr(self):
        return {"id": self.id, "name": str(self.name)}


class OrganizationRole(Base):
    __tablename__ = "organization_roles"
    id = Column(Integer, primary_key=True)

    # OrganizationRole name, selected from OrganizationRoleLevel
    name = Column(ChoiceType(OrganizationRoleEnum, impl=Integer()))

    # many-to-one relationship with repositories
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    organization = relationship("Organization", backref="roles", lazy=True)

    # many-to-many relationship with users
    users = relationship(
        "User",
        secondary=organization_roles_users,
        lazy="subquery",
        backref=backref("organization_roles", lazy=True),
    )

    def repr(self):
        return {"id": self.id, "name": str(self.name)}


class TeamRole(Base):
    __tablename__ = "team_roles"
    id = Column(Integer, primary_key=True)

    # Role name, selected from role choices
    name = Column(ChoiceType(TeamRoleEnum, impl=Integer()))

    # many-to-one relationship with teams
    team_id = Column(Integer, ForeignKey("teams.id"))
    team = relationship("Team", backref="roles", lazy=True)

    # many-to-many relationship with users
    users = relationship(
        "User",
        secondary=team_roles_users,
        lazy="subquery",
        backref=backref("team_roles", lazy=True),
    )

    def repr(self):
        return {"id": self.id, "name": str(self.name)}
