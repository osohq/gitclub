null  :=
space := $(null) #
colon := :#
POLICIES := $(subst ${space},${colon},$(wildcard app/*.polar))

dev: .make.requirements-install
	FLASK_DEBUG=1 FLASK_RUN_EXTRA_FILES="${POLICIES}" flask run --port=5000

run: .make.requirements-install
	flask run

test-server: .make.requirements-install
	FLASK_APP="app:create_app('sqlite:///test.db', False)" flask run

.make.requirements-install: requirements.txt
	pip install -r requirements.txt
	touch $@

fixtures: .make.requirements-install
	rm -f roles.db
	FLASK_APP="app:create_app(None, True)" flask run

fmt:
	black .

.PHONY: dev run fixtures
