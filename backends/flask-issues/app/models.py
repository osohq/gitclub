from dataclasses import dataclass
from typing import List, Optional
from flask.globals import g
from sqlalchemy.orm import relationship
from sqlalchemy.types import Integer, String
from sqlalchemy.schema import Column
import requests

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)

    def repr(self):
        return {"id": self.id, "email": self.email}


class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True)
    title = Column(String(256))
    repo_id = Column(Integer)
    # owner_id = Column(Integer)
    # owner: relationship(User, ...)

    def repr(self):
        return {"id": self.id, "title": self.title, "repo_id": self.repo_id}


@dataclass
class Repo:
    id: int
    name: str
    permissions: Optional[List[str]]
    orgId: int

    @classmethod
    def get(cls, org_id: int, id: int):
        try:
            repo = requests.get(
                f"http://localhost:5000/orgs/{org_id}/repos/{id}",
                headers={"authorization": f"user {g.current_user.id}"},
            )
            return Repo(**repo.json())
        except Exception as e:
            print(e)

    @classmethod
    def list(cls):
        try:
            repo = requests.get(
                f"http://localhost:5000/users/{g.current_user.id}/repos",
                headers={"authorization": f"user {g.current_user.id}"},
            )
            return map(lambda j: Repo(**j), repo.json())
        except Exception as e:
            print(e)
