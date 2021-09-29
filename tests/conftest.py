import subprocess
import signal
import socket
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
        prefix = prefix.rstrip("/") + "/"

    def new_request(prefix, f, method, url, *args, **kwargs):
        return f(method, prefix + url.lstrip("/"), *args, **kwargs)

    s = requests.Session()
    s.request = partial(new_request, prefix, s.request)
    return s


def is_port_open(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        result = sock.connect_ex(("127.0.0.1", port))
        return result == 0


def ensure_port_5000_is_open(process):
    interval = 0.5
    elapsed = interval
    sleep(interval)
    while not is_port_open(5000):
        sleep(interval)
        process.poll()
        if process.returncode is not None:
            raise RuntimeError(
                "Server died before port 5000 was opened. Check the output above to see why."
            )
        elapsed += interval
        if elapsed > 60:
            raise RuntimeError(
                "Server took more than 60s to start listening on port 5000, aborting."
            )


def xfail_backend(*envs, reason=None):
    env = os.environ.get("BACKEND", "flask-sqlalchemy")
    envs = envs if isinstance(envs, list) else [*envs]

    reason = (
        f"test is expected to fail for backend=`{env}`" + f"\n{reason}"
        if reason
        else ""
    )
    return pytest.mark.xfail(env in envs, reason=reason, strict=True)


DIRECTORIES = {
    "rails": "../backends/rails",
    "flask-sqlalchemy": "../backends/flask-sqlalchemy",
    "flask-sqlalchemy-oso": "../backends/flask-sqlalchemy-oso",
    "express-typeorm": "../backends/express-typeorm",
}


@pytest.fixture(scope="session")
def test_app():
    directory = DIRECTORIES[os.getenv("BACKEND", "flask-sqlalchemy-oso")]
    process = subprocess.Popen(
        ["make", "test-server", "-C", directory], start_new_session=True
    )
    ensure_port_5000_is_open(process)
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
