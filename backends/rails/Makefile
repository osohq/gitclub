dev: .make.bundle-install
	bundle exec rails s

test-server: .make.bundle-install
	RAILS_ENV=test bundle exec rails db:migrate
	RAILS_ENV=test bundle exec rails s

dev-actions: .make.actions-bundle-install
	cd gitclub-actions &&	bundle exec ruby server.rb

fixtures: .make.bundle-install
	bundle exec rails db:seed

.make.bundle-install: Gemfile
	bundle install
	touch $@

.make.actions-bundle-install: gitclub-actions/Gemfile
	cd gitclub-actions && bundle install
	touch $@

.PHONY: dev fixtures
