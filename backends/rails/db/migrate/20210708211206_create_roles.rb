class CreateRoles < ActiveRecord::Migration[6.1]
  def change
    create_table :org_roles do |t|
      t.references :user, null: false, foreign_key: true
      t.references :org, null: false, foreign_key: true
      t.string :name, null: false

      t.timestamps
    end

    create_table :repo_roles do |t|
      t.references :user, null: false, foreign_key: true
      t.references :repo, null: false, foreign_key: true
      t.string :name, null: false

      t.timestamps
    end
  end
end
