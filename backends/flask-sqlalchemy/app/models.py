from sqlalchemy.sql.sqltypes import Boolean
from sqlalchemy.types import Integer, String
from sqlalchemy.schema import Column, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class Org(Base):
    __tablename__ = "orgs"

    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True)
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


# docs: begin-repo-model
class Repo(Base):
    __tablename__ = "repos"

    id = Column(Integer, primary_key=True)
    name = Column(String(256))

    # many-to-one relationship with orgs
    org_id = Column(Integer, ForeignKey("orgs.id"))
    # docs: begin-repo-model-highlight
    org = relationship("Org", backref="repos", lazy=False)
    # docs: end-repo-model-highlight

    unique_name_in_org = UniqueConstraint(name, org_id)

    def repr(self):
        return {"id": self.id, "name": self.name}
        # docs: end-repo-model


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True)
    title = Column(String(256))
    closed = Column(Boolean, default=False)

    repo_id = Column(Integer, ForeignKey("repos.id"))
    repo = relationship("Repo", backref="issues", lazy=False)

    creator_id = Column(Integer, ForeignKey("users.id"))
    creator = relationship("User", backref="issues", lazy=False)

    def repr(self):
        return {"id": self.id, "title": self.title, "closed": self.closed}


class OrgRole(Base):
    __tablename__ = "org_roles"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user = relationship("User", backref="org_roles", lazy=True)
    org = relationship("Org", backref="roles", lazy=True)
    org_id = Column(Integer, ForeignKey("orgs.id"), nullable=False)
    name = Column(String, index=True)

    def repr(self):
        return {"user_id": self.user_id, "org_id": self.org_id, "name": self.name}


class RepoRole(Base):
    __tablename__ = "repo_roles"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    repo_id = Column(Integer, ForeignKey("repos.id"), nullable=False)
    repo = relationship("Repo", backref="roles", lazy=True)
    user = relationship("User", backref="repo_roles", lazy=True)
    name = Column(String, index=True)

    def repr(self):
        return {"user_id": self.user_id, "repo_id": self.repo_id, "name": self.name}
