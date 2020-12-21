import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app import create_app, models
from app.fixtures import load_fixture_data


@pytest.fixture
def db_path(tmp_path):
    d = tmp_path / "roles.db"
    d = "sqlite:///" + str(d.absolute())
    return d


@pytest.fixture
def test_client(db_path):
    flask_app = create_app(db_path, True)
    test_client = flask_app.test_client()
    return test_client


@pytest.fixture
def test_db_session(db_path):
    engine = create_engine(db_path)
    Session = sessionmaker(bind=engine)
    models.Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    load_fixture_data(session)

    return session
