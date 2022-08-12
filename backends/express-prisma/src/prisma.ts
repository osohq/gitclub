// import type { Connection, SelectQueryBuilder } from '@prisma/client';
import { UserType, Class, obj, PolarComparisonOperator } from 'oso/dist/src/types';
import {
    Adapter,
    isProjection,
    Filter,
    Datum,
    FilterCondition,
    Immediate,
    Relation,
    Projection,
} from 'oso/dist/src/filter';

// helpers for writing SQL
const ops = { Eq: 'equals', Geq: 'gte', Gt: 'gt', Leq: 'lte', Lt: 'lt', Neq: 'not' };
const orClauses = (clauses: object[]): any =>
    clauses.length === 0 ? {} : { "OR": clauses };
const andClauses = (clauses: object[]): any =>
    clauses.length === 0 ? {} : { "AND": clauses }

// Expand conditions like "user = #<user id=12>" to "user.id = 12"
// Only the ORM knows how to do this, so we need to do it here.
const expandObjectComparison = (c: FilterCondition): FilterCondition => {
    for (const { a, b } of [
        { a: 'lhs', b: 'rhs' },
        { a: 'rhs', b: 'lhs' },
    ] as { a: 'lhs' | 'rhs'; b: 'lhs' | 'rhs' }[]) {
        const q: Datum = c[a];
        if (isProjection(q) && q.fieldName === undefined)
            // rewrite to be of the form: 
            // LHS: { typeName: Repo, fieldName: 'id' }
            // cmp: cmp
            // RHS: { value: 1 }
            return {
                [a]: { typeName: q.typeName, fieldName: 'id' },
                cmp: c.cmp,
                [b]: { value: ((c[b] as Immediate).value as { id: number }).id },
            } as unknown as FilterCondition;
    }
    return c;
};

type PrismaQuery = [string, object, object];

export function prismaAdapter(prisma: any): Adapter<PrismaQuery, any> {
    return {
        executeQuery: ([model, query, _includes]: PrismaQuery) => prisma[model].findMany({ where: query }),
        buildQuery: (filter: Filter): any => {
            console.log("Polar FILTER: ", JSON.stringify(filter, null, 2))
            var { relations, conditions, model, types } = filter;

            const clauses = orClauses(conditions.map(cond => {
                const filters = cond.reduce((filterMap: Map<string, any>, filterCondition: FilterCondition) => {
                    // expand the filter if we have a primary key
                    const { lhs, cmp, rhs } = expandObjectComparison(filterCondition);
                    function getOp(fieldName: string, cmp: PolarComparisonOperator, value: Datum) {
                        return {
                            [fieldName]: { [ops[cmp]]: (value as Immediate).value }
                        }
                    }
                    if (isProjection(lhs) && isProjection(rhs)) {
                        throw new Error("don't know how to join two fields together yet")
                    }
                    if (isProjection(lhs)) {
                        const type = lhs.typeName;
                        if (!filterMap.has(type)) {
                            filterMap.set(type, [])
                        }
                        filterMap.set(type, [getOp((lhs as Projection).fieldName, cmp, rhs), ...filterMap.get(type)])
                    }

                    if (isProjection(rhs)) {
                        const type = rhs.typeName;
                        if (!filterMap.has(type)) {
                            filterMap.set(type, [])
                        }

                        filterMap.set(type, [getOp((rhs as Projection).fieldName, cmp, lhs), ...filterMap.get(type)])
                    }

                    // console.log(`Condition: ${JSON.stringify(cond, null, 2)} --> Filter: ${filterMap.get(type)}`)

                    return filterMap;
                }, new Map<string, any>());

                console.log("FILTERS: ", JSON.stringify({ ...filters.entries() }, null, 2));


                function getAllClauses(type: string): object {
                    const typeFilters = filters.get(type) || [];
                    filters.delete(type);

                    return {
                        ...andClauses(typeFilters), ...relations.filter(rel => rel.fromTypeName == type).reduce((query, rel) => {
                            filters.delete(type);
                            const { kind } = (
                                types.get(rel.fromTypeName) as UserType<Class<unknown>, unknown>
                            ).fields.get(rel.fromFieldName) as Relation;
                            const nestedClauses = getAllClauses(rel.toTypeName);
                            if (Object.keys(nestedClauses).length == 0) {
                                return query
                            }
                            if (kind == "many") {
                                return {
                                    [rel.fromFieldName]: {
                                        some: nestedClauses
                                    }, ...query
                                }
                            } else {
                                return {
                                    [rel.fromFieldName]: {
                                        is: nestedClauses
                                    }, ...query
                                }
                            }
                        }, {})
                    }
                }

                const whereClause = getAllClauses(model);
                if (filters.keys.length != 0) {
                    throw new Error(`Didn't use all filters: ` + JSON.stringify(filters, null, 2))
                }

                console.log("WHERE: ", JSON.stringify(whereClause, null, 2));
                return whereClause;
            }));

            function getAllIncludes(type: string): object {
                // const typeFilters = filters.get(type) || {};
                return {
                    ...relations.filter(rel => rel.fromTypeName == type).reduce((includes, rel) => {
                        // TODO: if we want to use the fields themselves
                        // const { kind } = (
                        //     types.get(rel.fromTypeName) as UserType<Class<unknown>, unknown>
                        // ).fields.get(rel.fromFieldName) as Relation;
                        const nestedIncludes = getAllIncludes(rel.toTypeName);
                        return {
                            [rel.fromFieldName]: Object.keys(nestedIncludes).length == 0 ? true : { include: nestedIncludes },
                            ...includes
                        }

                    }, {})
                }
            }

            const includes = getAllIncludes(model);

            return [model.toLowerCase(), clauses, includes]
        },
    };
}