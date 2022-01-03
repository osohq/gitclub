const express = require("express");
const bodyParser = require("body-parser");
const { Oso, defaultEqualityFn, Relation, Variable } = require("oso");
const { Expression } = require("oso/dist/src/Expression");
const { Pattern } = require("oso/dist/src/Pattern");
const knexfile = require("./knexfile");
const { cloneDeep } = require("lodash");

const knex = require("knex")(knexfile.development);
knex.on("query", (data) =>
  console.log(data.sql + " " + JSON.stringify(data.bindings))
);
const app = express();
app.use(bodyParser.json());

class Base {
  constructor(type, id) {
    this.type = type;
    this.id = id.toString();
  }

  static from(row, field_name) {
    return new Base(row[field_name + "_type"], row[field_name + "_id"]);
  }

  toString() {
    return `${this.type}:${this.id}`;
  }

  get roles() {
    return knex("roles")
      .where({
        resource_type: this.type,
        resource_id: this.id,
      })
      .then((rows) =>
        rows.map((row) => ({
          name: row.name,
          actor: Base.from(row, "actor"),
          resource: Base.from(row, "resource"),
        }))
      );
  }
}

class Role {}
class Relation2 {}

let oso = new Oso({
  equalityFn: equals,
});
oso.registerClass(Relation2, { name: "Relation" });
oso.registerClass(Role, {
  fields: {
    actor: new Relation("one", "User", "actor_id", "id"),
  },
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "User",
  name: "User",
});
// These classes are used to test the policy performance with increased
// complexity.
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Foo",
  name: "Foo",
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Bar",
  name: "Bar",
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Tenant",
  name: "Tenant",
  fields: {
    roles: new Relation("many", "Role", "id", "resource_id"),
    relations: new Relation("many", "Relation", "id", "object_id"),
  },
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Org",
  name: "Org",
  fields: {
    roles: new Relation("many", "Role", "id", "resource_id"),
    relations: new Relation("many", "Relation", "id", "object_id"),
  },
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Repo",
  name: "Repo",
  fields: {
    roles: new Relation("many", "Role", "id", "resource_id"),
    relations: new Relation("many", "Relation", "id", "object_id"),
  },
});
oso.loadFiles(["main.polar"]);

// app.post("/update_policy", async (req, res) => {
//   oso = new Oso();
//   oso.loadString(req.body.policy);
//   oso
// });

function equals(obj1, obj2) {
  if (
    typeof obj1 === "object" &&
    typeof obj2 === "object" &&
    "type" in obj1 &&
    "type" in obj2
  )
    return obj1.type === obj2.type && obj1.id === obj2.id;
  return defaultEqualityFn(obj1, obj2);
}

app.post("/roles", async (req, res) => {
  console.log(
    `Creating role:`,
    Base.from(req.body, "actor").toString(),
    req.body.name,
    Base.from(req.body, "resource").toString()
  );
  // TODO: This isn't safe at all
  await knex("roles").insert(req.body);
  res.send("ok");
});

app.delete("/roles", async (req, res) => {
  console.log(
    `Deleting role:`,
    Base.from(req.body, "actor").toString(),
    Base.from(req.body, "resource").toString()
  );
  const count = await knex("roles")
    .where({
      actor_type: req.body.actor_type,
      actor_id: req.body.actor_id,
      resource_type: req.body.resource_type,
      resource_id: req.body.resource_id,
    })
    .delete();
  console.log(`Deleted ${count} roles`);
  res.send("ok");
});

app.post("/relations", async (req, res) => {
  console.log(
    `Creating role:`,
    Base.from(req.body, "subject").toString(),
    req.body.predicate,
    Base.from(req.body, "object").toString()
  );
  // TODO: This isn't safe at all
  await knex("relations").insert(req.body);
  res.send("ok");
});

app.delete("/relations", async (req, res) => {
  console.log(
    `Deleting role:`,
    Base.from(req.body, "subject").toString(),
    Base.from(req.body, "object").toString()
  );
  const count = await knex("roles")
    .where({
      subject_type: req.body.subject_type,
      subject_id: req.body.subject_id,
      object_type: req.body.object_type,
      object_id: req.body.object_id,
    })
    .delete();
  console.log(`Deleted ${count} relations`);
  res.send("ok");
});

function assert(condition, errorMessage) {
  if (!condition) throw new Error(errorMessage);
}

/*
bindingsToQuery takes a set of bindings and turns them into a SQL query over the
roles and relations tables, like so:
{
  resource: {
    operator: "And",
    args: [
      {
        operator: "Isa",
        args: [{ name: "_this" }, { tag: "Repo", fields: {} }],
      },
      {
        operator: "In",
        args: [
          { name: "_relation_2310" },
          { operator: "Dot", args: [{ name: "_this" }, "relations"] },
        ],
      },
      {
        operator: "Isa",
        args: [
          { operator: "Dot", args: [{ name: "_relation_2310" }, "subject"] },
          { tag: "Org", fields: {} },
        ],
      },
      {
        operator: "Unify",
        args: [
          { operator: "Dot", args: [{ name: "_relation_2310" }, "predicate"] },
          "parent",
        ],
      },
      {
        operator: "In",
        args: [
          { name: "_role_2326" },
          {
            operator: "Dot",
            args: [
              {
                operator: "Dot",
                args: [{ name: "_relation_2310" }, "subject"],
              },
              "roles",
            ],
          },
        ],
      },
      {
        operator: "Unify",
        args: [
          { operator: "Dot", args: [{ name: "_role_2326" }, "name"] },
          "owner",
        ],
      },
      {
        operator: "Unify",
        args: [
          { operator: "Dot", args: [{ name: "_role_2326" }, "actor"] },
          { type: "User", id: "2" },
        ],
      },
    ],
  },
}
=>
SELECT object_id FROM relations _relation_1146
JOIN roles _role_1162
  ON _role_1162.resource_type = _relation_1146.subject_type
  AND _role_1162.resource_id = _relation_1146.subject_id
WHERE _role_1162.actor_id = '4'
  AND _role_1162.actor_type = 'User'
  AND _relation_1146.object_type = 'Repo'
*/
function bindingsToQuery(bindings) {
  assert(
    Object.keys(bindings).length === 1,
    "Can only check one variable at a time: " +
      JSON.stringify(Object.keys(bindings))
  );
  const condition = Object.values(bindings)[0];
  assert(condition.operator === "And", "Top-level condition must be an AND");
  const conditions = condition.args;
  const sources = {};
  let base = null;
  const joins = [];
  const whereConditions = [];
  let targetType = null;

  // NOTE: this is tightly coupled with the has_role and has_relation
  // definitions in the oso-service policy. It's also probably a bad idea, just
  // a proof of concept.
  //
  // This would also be a lot cleaner if we used one schema for roles AND
  // relations.
  //
  // Basic algorithm:
  // ---------------
  // Go through all conditions (Isa, In, Unify, etc)
  // For "In" conditions:
  //   In conditions take one of the forms:
  //     _role_ABC in _this.roles or
  //     _role_ABC in _relation_XYZ.subject.roles
  //   In the former case (where its a lookup on _this), then we consider the
  //   variable to be the "base" of the query: SELECT * FROM [table]
  //   In the latter case (where its a lookup on ANOTHER relation/role's
  //   property), then the variable is added as a join.
  // For "Unify" conditions:
  //   Add a where clause
  // For "Isa" conditions:
  //   Ignore unless on _this, in which case we add a condition on the base table
  for (let condition of conditions) {
    if (
      condition.operator === "Isa" &&
      condition.args[0] instanceof Variable &&
      condition.args[0].name === "_this"
    ) {
      // This condition defines the type of the object we're looking for
      targetType = condition.args[1].tag;
    } else if (condition.operator === "In") {
      assert(
        condition.args[0] instanceof Variable,
        "First argument to In must be a variable: " +
          JSON.stringify(condition.args[0])
      );
      const sourceName = condition.args[0].name;
      const isRole = condition.args[1].args[1] === "roles";
      const sourceTable = isRole ? "roles" : "relations";
      const from = condition.args[1].args[0];
      // thisSourceProp is a bad name, but it means the property on this variable
      // that corresponds to the resource from which this relationship is defined
      const thisSourceProp = isRole ? "resource" : "object";
      if (from instanceof Variable && from.name === "_this") {
        // from is the thing we're trying to figure out
        base = {
          alias: sourceName,
          table: sourceTable,
          field: thisSourceProp + "_id",
        };
        whereConditions.push({
          [`${sourceName}.${thisSourceProp + "_type"}`]: targetType,
        });
      } else if (from.operator === "Dot") {
        const fromName = from.args[0].name;
        // Create a new join
        const fromSourceProp = from.args[1];
        joins.push({
          alias: sourceName,
          table: sourceTable,
          on: {
            [`${sourceName}.${thisSourceProp + "_type"}`]: `${fromName}.${
              fromSourceProp + "_type"
            }`,
            [`${sourceName}.${thisSourceProp + "_id"}`]: `${fromName}.${
              fromSourceProp + "_id"
            }`,
          },
        });
      }
    }
    if (condition.operator === "Unify") {
      assert(
        condition.args[0].operator === "Dot",
        "Unifies must be on dot lookups"
      );
      const sourceName = condition.args[0].args[0].name;
      const propertyName = condition.args[0].args[1];
      const value = condition.args[1];
      if (propertyName === "actor" || propertyName === "subject") {
        whereConditions.push({
          [`${sourceName}.${propertyName + "_type"}`]: value.type,
          [`${sourceName}.${propertyName + "_id"}`]: value.id,
        });
      } else {
        whereConditions.push({
          [`${sourceName}.${propertyName}`]: value,
        });
      }
    }
  }
  // console.log("BASE:", base);
  // console.log("JOINS: ", joins);
  // console.log("WHERES: ", whereConditions);

  let query = knex
    .select({ id: `${base.alias}.${base.field}` })
    .from({ [base.alias]: base.table });
  for (let join of joins) {
    query = query.join(
      { [join.alias]: join.table },
      knex.raw(
        Object.entries(join.on)
          .map((arr) => arr.join(" = "))
          .join(" AND ")
      )
    );
  }
  for (let where of whereConditions) {
    query = query.where(where);
  }
  return query;
}

const resultsCache = {};

// queryHasRole runs a has_role query with an unbound resource and returns its
// results, caching the results based on actorType, role, and resourceType
// WART: The actor's actual ID has to be awkwardly stuffed back into the bindings.
async function queryHasRole(actorType, actorId, role, resourceType) {
  const cacheKey = actorType + ":" + role + ":" + resourceType;
  const resourceVar = new Variable("resource");
  const constraint = new Expression("And", [
    new Expression("Isa", [
      resourceVar,
      new Pattern({ tag: resourceType, fields: {} }),
    ]),
  ]);
  const bindings = new Map();
  bindings.set("resource", constraint);
  if (!resultsCache[cacheKey]) {
    const resultIterator = await oso.queryRule(
      { acceptExpression: true, bindings },
      "has_role",
      new Base(actorType, "DYNAMIC_ACTOR_ID"),
      role,
      resourceVar
    );
    const results = [];
    for await (result of resultIterator) {
      results.push(Object.fromEntries(result.entries()));
    }
    resultsCache[cacheKey] = results;
  }
  // HACK ALERT: Stuff actorId into the results, replacing DYNAMIC_ACTOR_ID
  const results = cloneDeep(resultsCache[cacheKey]);
  for (let result of results) {
    const conditions = result.resource.args;
    for (let condition of conditions) {
      const actorArg = condition.args.find(
        (arg) => arg.id === "DYNAMIC_ACTOR_ID"
      );
      if (actorArg) {
        actorArg.id = actorId;
      }
    }
  }
  return results;
}

app.get(
  "/has_role/:actorType/:actorId/:roleName/:resourceType/:resourceId",
  async (req, res) => {
    const start = new Date().getTime();
    const actor = new Base(req.params.actorType, req.params.actorId);
    const resource = new Base(req.params.resourceType, req.params.resourceId);
    const role = req.params.roleName;
    const resourceVar = new Variable("resource");
    console.log("Querying role", actor.toString(), role, resource.toString());
    const otherResults = await queryHasRole(
      actor.type,
      actor.id,
      role,
      resource.type
    );
    let found = false;
    for await (result of otherResults) {
      // console.log(JSON.stringify(result, undefined, 2));

      const bindings = result; //Object.fromEntries(result.entries());
      const query = bindingsToQuery(bindings);
      const results = await knex
        .select("id")
        .from(query)
        .where("id", resource.id);
      console.log("RESULTS:", results);
      if (results.length > 0) {
        found = true;
        break;
      }
    }
    const duration = new Date().getTime() - start;
    console.log("Got result", found, "in", duration, "ms");
    res.send(found);
  }
);

app.listen(5002, () => {
  console.log("Listening on port 5002");
});
