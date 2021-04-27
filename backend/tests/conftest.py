import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from oso import Oso
from sqlalchemy_oso import register_models
from sqlalchemy_oso.roles2 import OsoRoles

from app import create_app, models
from app.fixtures import load_fixture_data


@pytest.fixture
def db_path(tmp_path):
    d = tmp_path / "roles.db"
    d = "sqlite:///" + str(d.absolute())
    return d


@pytest.fixture
def test_app(db_path):
    return create_app(db_path, True)


@pytest.fixture
def test_client(test_app):
    test_client = test_app.test_client()
    return test_client


@pytest.fixture
def engine(db_path):
    return create_engine(db_path)


@pytest.fixture
def Session(engine):
    return sessionmaker(bind=engine)


@pytest.fixture
def oso_roles(Session):
    oso = Oso()
    register_models(oso, models.Base)
    roles = OsoRoles(oso, models.Base, models.User, Session)
    oso.load_file("app/authorization.polar")
    return oso, roles


@pytest.fixture
def test_db_session(Session, engine, oso_roles):
    models.Base.metadata.create_all(engine)
    session = Session()
    _, roles = oso_roles
    load_fixture_data(session, roles)
    return session
