dev: .make.bundle-install
	bundle exec rails s

test-server: .make.bundle-install
	RAILS_ENV=test bundle exec rails db:migrate
	RAILS_ENV=test bundle exec rails s

fixtures: .make.bundle-install
	bundle exec rails db:seed

.make.bundle-install: Gemfile
	bundle install
	touch $@

.PHONY: dev fixtures
