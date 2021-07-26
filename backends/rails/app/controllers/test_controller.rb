class TestController < ApplicationController
  def reset
    Rails.application.load_seed
  end
end
