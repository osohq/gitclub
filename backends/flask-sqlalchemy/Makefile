null  :=
space := $(null) #
colon := :#
POLICIES := $(subst ${space},${colon},$(wildcard app/*.polar))

dev:
	FLASK_DEBUG=1 FLASK_RUN_EXTRA_FILES="${POLICIES}" flask run --port=5000

run:
	flask run

test-server:
	FLASK_APP="app:create_app(None, True)" TEST=1 flask run

fixtures:
	rm -f roles.db
	FLASK_APP="app:create_app(None, True)" flask run

fmt:
	black .

.PHONY: dev run fixtures
