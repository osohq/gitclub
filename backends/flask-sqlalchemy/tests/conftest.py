import subprocess
import signal
import pytest
from time import sleep
import requests
from functools import partial
import os

def PrefixUrlSession(prefix=None):
    """
    This is just like a normal requests.Session, but the given prefix is
    prepended to each request URL.
    """
    if prefix is None:
        prefix = ""
    else:
        prefix = prefix.rstrip('/') + '/'

    def new_request(prefix, f, method, url, *args, **kwargs):
        return f(method, prefix + url, *args, **kwargs)

    s = requests.Session()
    s.request = partial(new_request, prefix, s.request)
    return s


def ensure_port_5000_is_open():
    # TODO:
    sleep(1)


@pytest.fixture(scope="session")
def test_app():
    process = subprocess.Popen(["make", "test-server"], start_new_session=True)
    ensure_port_5000_is_open()
    yield process
    pgrp = os.getpgid(process.pid)
    os.killpg(pgrp, signal.SIGINT)
    process.wait()
    print("DONE")


@pytest.fixture
def test_client(test_app):
    with PrefixUrlSession("http://localhost:5000") as session:
        def log_in_as(email):
            session.post("/session", json={"email": email})
        session.log_in_as = log_in_as  # type: ignore
        session.post("/_reset")

        yield session

