class TestController < ApplicationController
  def reset
    `rails db:seed:replant`
  end
end
