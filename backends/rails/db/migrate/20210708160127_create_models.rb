class CreateModels < ActiveRecord::Migration[6.1]
  def change
    create_table :orgs do |t|
      t.string :name, null: false, index: { unique: true }
      t.string :base_repo_role
      t.string :billing_address

      t.timestamps
    end

    create_table :users do |t|
      t.string :email, null: false, index: { unique: true }

      t.timestamps
    end

    create_table :repos do |t|
      t.string :name
      t.references :org, null: false, foreign_key: true

      t.timestamps
    end
    add_index :repos, [:name, :org_id]

    create_table :issues do |t|
      t.string :title
      t.boolean :closed, null: false, default: false
      t.references :repo, null: false, foreign_key: true
      t.references :creator, foreign_key: {to_table: :users}
      t.timestamps
    end
  end
end
