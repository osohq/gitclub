import datetime

from sqlalchemy.types import Integer, String, DateTime
from sqlalchemy.schema import Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, backref

from sqlalchemy.ext.declarative import declarative_base

from sqlalchemy_oso.roles import resource_role_class


Base = declarative_base()


## MODELS ##


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
    # TODO(gj): enum?
    base_repo_role = Column(String)
    billing_address = Column(String)

    def repr(self):
        return {
            "id": self.id,
            "name": self.name,
            "billing_address": self.billing_address,
            "base_repo_role": self.base_repo_role,
        }


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)

    def repr(self):
        return {"id": self.id, "email": self.email}


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))

    # many-to-one relationship with organizations
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    organization = relationship("Organization", backref="teams", lazy=True)

    unique_name_in_organization = UniqueConstraint(name, organization_id)

    def repr(self):
        return {"id": self.id, "name": self.name}


class Repository(Base):
    __tablename__ = "repositories"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))

    # many-to-one relationship with organizations
    organization_id = Column(Integer, ForeignKey("organizations.id"))
    organization = relationship("Organization", backref="repositories", lazy=True)

    unique_name_in_organization = UniqueConstraint(name, organization_id)

    # time info
    created_date = Column(DateTime, default=datetime.datetime.utcnow)
    updated_date = Column(DateTime, default=datetime.datetime.utcnow)

    def repr(self):
        return {"id": self.id, "name": self.name}


class Issue(Base):
    __tablename__ = "issues"

    # TODO(gj): Real UUIDs & start issue count at 1 for every repo.
    id = Column(Integer, primary_key=True)
    title = Column(String(256))

    repository_id = Column(Integer, ForeignKey("repositories.id"))
    repository = relationship("Repository", backref="issues", lazy=True)

    def repr(self):
        return {"id": self.id, "title": self.title}


## ROLE MODELS ##


RepositoryRoleMixin = resource_role_class(
    declarative_base=Base,
    user_model=User,
    resource_model=Repository,
    role_choices=["READ", "TRIAGE", "WRITE", "MAINTAIN", "ADMIN"],
)


class RepositoryRole(Base, RepositoryRoleMixin):
    team_id = Column(Integer, ForeignKey("teams.id"))
    team = relationship("Team", backref="repository_roles", lazy=True)

    def repr(self):
        return {"id": self.id, "name": str(self.name)}


OrganizationRoleMixin = resource_role_class(
    Base, User, Organization, ["OWNER", "MEMBER", "BILLING"]
)


class OrganizationRole(Base, OrganizationRoleMixin):
    def repr(self):
        return {"id": self.id, "name": str(self.name)}


TeamRoleMixin = resource_role_class(Base, User, Team, ["MAINTAINER", "MEMBER"])


class TeamRole(Base, TeamRoleMixin):
    def repr(self):
        return {"id": self.id, "name": str(self.name)}
