# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2021_07_08_211206) do

  create_table "issues", force: :cascade do |t|
    t.string "title"
    t.boolean "closed", default: false, null: false
    t.integer "repo_id", null: false
    t.integer "creator_id"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["creator_id"], name: "index_issues_on_creator_id"
    t.index ["repo_id"], name: "index_issues_on_repo_id"
  end

  create_table "org_roles", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "org_id", null: false
    t.string "name", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["org_id"], name: "index_org_roles_on_org_id"
    t.index ["user_id"], name: "index_org_roles_on_user_id"
  end

  create_table "orgs", force: :cascade do |t|
    t.string "name", null: false
    t.string "base_repo_role"
    t.string "billing_address"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["name"], name: "index_orgs_on_name", unique: true
  end

  create_table "repo_roles", force: :cascade do |t|
    t.integer "user_id", null: false
    t.integer "repo_id", null: false
    t.string "name", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["repo_id"], name: "index_repo_roles_on_repo_id"
    t.index ["user_id"], name: "index_repo_roles_on_user_id"
  end

  create_table "repos", force: :cascade do |t|
    t.string "name"
    t.integer "org_id", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["name", "org_id"], name: "index_repos_on_name_and_org_id"
    t.index ["org_id"], name: "index_repos_on_org_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "issues", "repos"
  add_foreign_key "issues", "users", column: "creator_id"
  add_foreign_key "org_roles", "orgs"
  add_foreign_key "org_roles", "users"
  add_foreign_key "repo_roles", "repos"
  add_foreign_key "repo_roles", "users"
  add_foreign_key "repos", "orgs"
end
