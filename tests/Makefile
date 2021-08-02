test: test-flask-sqlalchemy test-rails

test-flask-sqlalchemy: .make.requirements-install
	BACKEND=flask-sqlalchemy pytest

test-rails: .make.requirements-install
	BACKEND=rails pytest

fmt: .make.requirements-install
	black .

.make.requirements-install: requirements.txt
	pip install -r requirements.txt
	touch $@
