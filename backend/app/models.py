import datetime

from sqlalchemy.types import Integer, String, DateTime
from sqlalchemy.schema import Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


## MODELS ##


class Org(Base):
    __tablename__ = "orgs"

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

    # many-to-one relationship with orgs
    org_id = Column(Integer, ForeignKey("orgs.id"))
    org = relationship("Org", backref="teams", lazy=True)

    unique_name_in_org = UniqueConstraint(name, org_id)

    def repr(self):
        return {"id": self.id, "name": self.name}


class Repo(Base):
    __tablename__ = "repos"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))

    # many-to-one relationship with orgs
    org_id = Column(Integer, ForeignKey("orgs.id"))
    org = relationship("Org", backref="repos", lazy=True)

    unique_name_in_org = UniqueConstraint(name, org_id)

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

    repo_id = Column(Integer, ForeignKey("repos.id"))
    repo = relationship("Repo", backref="issues", lazy=True)

    def repr(self):
        return {"id": self.id, "title": self.title}


# TeamRoleMixin = resource_role_class(Base, User, Team, ["MAINTAINER", "MEMBER"])
#
#
# class TeamRole(Base, TeamRoleMixin):
#     def repr(self):
#         return {"id": self.id, "name": str(self.name)}
