exports.up = function (knex) {
  return (
    knex.schema
      .createTable("roles", function (table) {
        table.increments("id");
        table.string("actor_type", 255).notNullable();
        table.string("actor_id", 255).notNullable();
        table.string("name", 255).notNullable();
        table.string("resource_type", 255).notNullable();
        table.string("resource_id", 255).notNullable();

        table.index(["actor_type", "actor_id"]);
        table.index(["resource_type", "resource_id"]);
      })
      // TODO: just use relations for roles? might make sense
      .createTable("relations", function (table) {
        table.increments("id");
        table.string("subject_type", 255).notNullable();
        table.string("subject_id", 255).notNullable();
        table.string("predicate", 255).notNullable();
        table.string("object_type", 255).notNullable();
        table.string("object_id", 255).notNullable();

        table.index(["subject_type", "subject_id"]);
        table.index(["object_type", "object_id"]);
      })
  );
};

exports.down = function (knex) {
  return knex.schema.dropTable("roles").dropTable("relations");
};
