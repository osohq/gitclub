const express = require("express");
const bodyParser = require("body-parser");
const { Oso, defaultEqualityFn, Relation, Variable } = require("oso");
const { Expression } = require("oso/dist/src/Expression");
const { Pattern } = require("oso/dist/src/Pattern");
const knexfile = require("./knexfile");
const { cloneDeep } = require("lodash");
const SQLFormat = require("sql-formatter");

const knex = require("knex")(knexfile.development);
knex.on("query", (data) =>
  console.log(
    "[SQL] " +
      SQLFormat.format(data.sql).split("\n").join("\n[SQL] ") +
      "\n  " +
      JSON.stringify(data.bindings)
  )
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

let oso = new Oso({
  equalityFn: equals,
});
oso.registerClass(Object, {
  // TODO: how to register classes when they are declared by other services?
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
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Org",
  name: "Org",
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Repo",
  name: "Repo",
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Action",
  name: "Action",
});
oso.registerClass(Object, {
  isaCheck: (obj) => obj.type === "Issue",
  name: "Issue",
});
oso.loadFiles([
  "policies/oso-service.polar",
  "policies/gitclub.polar",
  "policies/gitclub-actions.polar",
]);

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

function dotPath(expression) {
  if (expression.name) return [expression.name];
  assert(
    expression.operator === "Dot",
    "dotPath method called on a non-dot operator: " + debugPrint(expression)
  );
  const path = [];
  // TODO: make this work with more than just a.b lookups
  // e.g. a.b.c lookups
  return [...dotPath(expression.args[0]), expression.args[1]];
}

async function simplifyBindings(bindings) {
  const simplifiedBindings = {};
  for (let key in bindings) {
    const constraints = await simplifyConstraints(bindings[key]);
    if (!constraints) return null;
    simplifiedBindings[key] = constraints;
  }
  return simplifiedBindings;
}

// Simplifies constraints for one variable by pulling out role and relation
// constraints, building a SQL query, and in-lining the query results into a
// simpler set of contraints.
// Example:
//   _this Isa Issue{}
//   _object_615.id = _this.repo_id
//   _object_615 Isa Repo{}
//   _relation_617 In _object_615.relations
//   _relation_617.subject Isa Org{}
//   _relation_617.predicate = "parent"
//   _role_641 In _relation_617.subject.roles
//   _role_641.name = "owner"
//   _role_641.actor = {"type":"User","id":"1"}
// =>
//   _this.repo_id In ["1", "3"]
async function simplifyConstraints(expression) {
  assert(expression.operator === "And", "Top-level condition must be an AND");
  const conditions = expression.args;

  const inConditions = conditions.filter(
    (condition) =>
      condition.operator === "In" &&
      condition.args[1].operator === "Dot" &&
      ["roles", "relations"].includes(condition.args[1].args[1])
  );

  const isaConditions = conditions.filter(
    (condition) => condition.operator === "Isa"
  );

  const otherConditions = conditions.filter(
    (c) => !inConditions.includes(c) && !isaConditions.includes(c)
  );

  const selections = {};

  /*
  "Selections" are an intermediate representation of the constraint data in a
  format that is convenient for building a SQL query:
  Example:
    _object_615 Isa Repo{}
    _relation_617 In _object_615.relations
    _relation_617.subject Isa Org{}
    _relation_617.predicate = "parent"
    _role_641 In _relation_617.subject.roles
    _role_641.name = "owner"
    _role_641.actor = {"type":"User","id":"1"}
  =>
  {
    table: "relations",
    name: "_relation_617",
    to: {
      name: "_object_615",
      field: null,
      type: "Repo"
    },
    from: {
      name: "_role_641",
      field: "resource",
      type: "Org"
    },
    predicate: "parent"
  },
  {
    table: "roles",
    name: "_role_641",
    to: {
      name: "_relation_617",
      field: "subject",
      type: "Org"
    },
    from: {
      name: null,
      type: "User",
      id: "1"
    },
    predicate: "owner"
  }
  */

  const unhandledConditions = [];

  for (let condition of inConditions) {
    assert(
      condition.args[0] instanceof Variable,
      "In condition has a first argument that is not a variable: " +
        debugPrint(condition)
    );
    const varName = condition.args[0].name;
    const dependencyPath = dotPath(condition.args[1]);
    const toName = dotPath(condition.args[1])[0];
    const toField = dependencyPath.length > 2 ? dependencyPath[1] : null;
    selections[varName] = {
      table: varName.startsWith("_role") ? "roles" : "relations",
      name: varName,
      to: {
        name: toName,
        field: toField,
        type: null,
      },
      from: { name: null, field: null, type: null },
      predicate: null,
    };
  }

  const typesByExpression = {};

  for (let condition of isaConditions) {
    // _object_615 Isa Action{}
    // _relation_617.subject Isa Org{}

    // Check for duplicate Isa
    // TODO: if there are supertypes/subtypes, this won't work
    if (typesByExpression[debugPrint(condition.args[0])]) return null;
    typesByExpression[debugPrint(condition.args[0])] = condition.args[1].tag;
    const type = condition.args[1].tag;
    const varPath = dotPath(condition.args[0]);
    if (varPath.length === 1) {
      const selection = Object.values(selections).find((sel) => {
        return sel.to.name === varPath[0];
      });
      if (!selection) continue;
      selection.to.type = type;
    } else if (varPath.length === 2) {
      const selection = Object.values(selections).find((sel) => {
        return sel.to.name === varPath[0] && sel.to.field === varPath[1];
      });
      if (!selection) continue;
      selection.to.type = type;
    }
  }

  // Populate selection.from
  for (let selection of Object.values(selections)) {
    const toSelection = Object.values(selections).find((other) => {
      return other.name === selection.to.name;
    });
    if (toSelection) {
      const fromField = selection.table === "roles" ? "resource" : "object";
      toSelection.from.name = selection.name;
      toSelection.from.type = selection.to.type;
      toSelection.from.field = fromField;
    }
  }

  // Populate predicates and other where conditions
  for (let condition of otherConditions) {
    switch (condition.operator) {
      case "Unify":
        if (!condition.args[0].operator) {
          unhandledConditions.push(condition);
          continue;
        }
        const varPath = dotPath(condition.args[0]);
        if (varPath.length === 2 && selections[varPath[0]]) {
          const selection = selections[varPath[0]];
          // _role_641.name = "owner"
          // _role_641.actor = {"type":"User","id":"1"}
          // _relation_617.predicate = "parent"
          if (selection.table === "relations" && varPath[1] === "predicate") {
            selection.predicate = condition.args[1];
          } else if (selection.table === "roles" && varPath[1] === "name") {
            selection.predicate = condition.args[1];
          } else if (selection.table === "roles" && varPath[1] === "actor") {
            assert(
              condition.args[1].type && condition.args[1].id,
              "Non-bound actor condition: " + debugPrint(condition)
            );
            selection.from.type = condition.args[1].type;
            selection.from.id = condition.args[1].id;
          } else {
            unhandledConditions.push(condition);
          }
        } else {
          unhandledConditions.push(condition);
        }
    }
  }

  // Target selection is the one where sel.to is not another selection
  const targetSelection = Object.values(selections).find(
    (sel) => !selections[sel.to.name]
  );

  for (let condition of unhandledConditions) {
    if (
      condition.operator === "Unify" &&
      condition.args[0].operator === "Dot"
    ) {
      const path = dotPath(condition.args[0]);
      if (path[0] === targetSelection.to.name && path[1] === "id") {
        // args[0] is the value we'll be selecting from the DB
        condition.operator = "In";
        condition.args = [condition.args[1], "_OUTPUT"];
      }
    }
  }

  const outputCondition = unhandledConditions.find(
    (cond) => cond.args[1] === "_OUTPUT"
  );
  if (!outputCondition) {
    unhandledConditions.push({
      operator: "In",
      args: [{ operator: "Dot", args: [{ name: "_this" }, "id"] }, "_OUTPUT"],
    });
  }

  const targetField =
    targetSelection.table === "roles" ? "resource_id" : "object_id";
  let query = knex
    .select({ id: `${targetSelection.name}.${targetField}` })
    .from({ [targetSelection.name]: targetSelection.table });

  for (let selection of Object.values(selections)) {
    if (selection !== targetSelection) {
      // Add a join
      const to = selections[selection.to.name];
      const fromField = to.from.field;
      const toField = selection.to.field;
      // JOIN [selection.table] ON [selection.name].[fromField] = [to.name].[toField]
      let condition = `${selection.name}.${fromField}_id = ${to.name}.${toField}_id`;
      condition += ` AND ${selection.name}.${fromField}_type = ${to.name}.${toField}_type`;
      query.join({ [selection.name]: selection.table }, knex.raw(condition));
    }

    const predicateField = selection.table === "roles" ? "name" : "predicate";
    query.where(`${selection.name}.${predicateField}`, selection.predicate);

    const toField = selection.table === "roles" ? "resource" : "object";
    query.where(`${selection.name}.${toField}_type`, selection.to.type);

    if (selection.from.id) {
      const fromField = selection.table === "roles" ? "actor" : "subject";
      query.where(`${selection.name}.${fromField}_id`, selection.from.id);
      query.where(`${selection.name}.${fromField}_type`, selection.from.type);
    }
  }

  const ids = (await query).map((res) => res.id);
  // If no ids come back, there are no results. Return null
  if (ids.length === 0) return null;
  unhandledConditions.forEach((cond) => {
    if (cond.args[1] === "_OUTPUT") cond.args[1] = ids;
  });

  return {
    operator: "And",
    args: unhandledConditions,
  };
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
      const newConstraints = await simplifyBindings(bindings);
      if (!newConstraints) continue;
      // TODO: this next line makes a LOT of assumptions about the constraints
      // coming back from simplifyBindings!
      // It basically assumes there's one constraint and it looks like:
      // _this.id In ["1", "2", "3"]
      if (newConstraints.resource.args[0].args[1].includes(resource.id)) {
        found = true;
        break;
      }
    }
    const duration = new Date().getTime() - start;
    console.log("Got result", found, "in", duration, "ms");
    res.send(found);
  }
);

function debugPrint(expression) {
  if (expression.operator) {
    const args = expression.args.map(debugPrint);
    if (expression.operator === "And") {
      return args.join(" AND\n  ");
    } else if (expression.operator === "Dot") {
      return [args[0], expression.args[1]].join(".");
    } else if (expression.operator === "Unify") {
      return args.join(" = ");
    } else {
      return args.join(" " + expression.operator + " ");
    }
  } else if (expression.name) {
    return expression.name;
  } else if (expression.tag) {
    return `${expression.tag}${JSON.stringify(expression.fields)}`;
  } else {
    return JSON.stringify(expression);
  }
}

app.get(
  "/authorize/:actorType/:actorId/:action/:resourceType/:resourceId",
  async (req, res) => {
    const start = new Date().getTime();
    const actor = new Base(req.params.actorType, req.params.actorId);
    const resource = new Base(req.params.resourceType, req.params.resourceId);
    const action = req.params.action;

    const resourceVar = new Variable("resource");
    const constraint = new Expression("And", [
      new Expression("Isa", [
        resourceVar,
        new Pattern({ tag: resource.type, fields: {} }),
      ]),
    ]);
    const bindings = new Map();
    bindings.set("resource", constraint);
    const resultsGen = await oso.queryRule(
      { acceptExpression: true, bindings },
      "allow",
      actor,
      action,
      resourceVar
    );
    const results = {};
    for await (let result of resultsGen) {
      // HACK: clean up results that include constraints like "_this Isa Org"
      // those constraints are never met because _this is a Repo.
      // TODO: this should somehow be done in the VM
      const incompatibleIsaConstraint = result
        .get("resource")
        .args.find(
          (expr) =>
            expr.operator === "Isa" &&
            expr.args[0].name === "_this" &&
            expr.args[1].tag !== resource.type
        );
      if (incompatibleIsaConstraint) {
        console.log(
          "Skipping result because of incompatible constraint: ",
          debugPrint(incompatibleIsaConstraint)
        );
        continue;
      }
      console.log("RESULT:", debugPrint(result.get("resource")));
      const newConstraints = await simplifyBindings(
        Object.fromEntries(result.entries())
      );
      if (!newConstraints) continue;
      for (let key in newConstraints) {
        console.log(debugPrint(newConstraints[key]));
      }
      results[debugPrint(newConstraints)] = newConstraints;
    }

    // const plan = await oso.filterPlan(results, "resource", "Action");
    // console.log(JSON.stringify(plan, undefined, 2));

    const duration = new Date().getTime() - start;
    console.log("GOT RESULTS IN", duration, "ms");
    res.send(Object.values(results));
  }
);

app.listen(5002, () => {
  console.log("Listening on port 5002");
});
