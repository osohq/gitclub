import sys

# We need to be able to import fixtures from somewhere, so we add the flask
# sqlalchemy backend to the path.
# TODO: should we perhaps share fixtures between backends?
sys.path.append("../backends/flask-sqlalchemy")
