import SQLSelect from ".";
import { Dialect, Condition, Fields, Query } from "./types";

const toSQL = (dialect: Dialect, fields: Fields, query?: Query) =>
    new SQLSelect(dialect, fields, query).sql();

describe("generateSql", () => {
    const fields = {
        1: "id",
        2: "name",
        3: "date_joined",
        4: "age",
        5: "*",
    };

    describe("fields", () => {
        test.each([
            [
                "mysql",
                "SELECT `id`, `name`, `date_joined`, `age`, * FROM data;",
            ],
            [
                "postgres",
                'SELECT "id", "name", "date_joined", "age", * FROM data;',
            ],
            [
                "sqlserver",
                'SELECT "id", "name", "date_joined", "age", * FROM data;',
            ],
        ])("should correctly quote fields for '%s'", (dialect, expectedSql) => {
            const sql = toSQL(dialect as Dialect, fields);
            expect(sql).toEqual(expectedSql);
        });
    });

    describe("query.limit", () => {
        test.each([
            ["mysql", "SELECT * FROM data LIMIT 10;"],
            ["postgres", "SELECT * FROM data LIMIT 10;"],
            ["sqlserver", "SELECT TOP 10 * FROM data;"],
        ])("should correctly set limit for '%s'", (dialect, expectedSql) => {
            const sql = toSQL(dialect as Dialect, { 1: "*" }, { limit: 10 });
            expect(sql).toEqual(expectedSql);
        });
    });

    describe("quere.where", () => {
        describe('">" and "<" operators', () => {
            test.each([
                [
                    ">",
                    [["field", 4], 35],
                    'SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" > 35;',
                ],
                [
                    "<",
                    [["field", 4], 35],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" < 35;`,
                ],
                [
                    "<",
                    [
                        ["field", 4],
                        ["field", 3],
                    ],
                    'SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" < "date_joined";',
                ],
                [
                    ">",
                    [44, 35],
                    'SELECT "id", "name", "date_joined", "age", * FROM data WHERE 44 > 35;',
                ],
            ])(
                "should correctly handle '%s' operator with '%j'",
                (operator, args, expectedSql) => {
                    const sql = toSQL("postgres" as Dialect, fields, {
                        where: [operator, ...args] as Condition,
                    });
                    expect(sql).toEqual(expectedSql);
                }
            );
        });

        describe('"="operator', () => {
            test.each([
                [
                    "=",
                    [["field", 4], "cam"],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" = 'cam';`,
                ],
                [
                    "=",
                    [["field", 4], 35],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" = 35;`,
                ],
                [
                    "=",
                    [["field", 4], 35, 44],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" IN (35, 44);`,
                ],
                [
                    "=",
                    [
                        ["field", 4],
                        ["field", 3],
                    ],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" = "date_joined";`,
                ],
                [
                    "=",
                    [["field", 4], null],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" IS NULL;`,
                ],
            ])(
                "should correctly handle '%s' operator with '%j'",
                (operator, args, expectedSql) => {
                    const sql = toSQL("postgres" as Dialect, fields, {
                        where: [operator, ...args] as Condition,
                    });
                    expect(sql).toEqual(expectedSql);
                }
            );
        });

        describe('"!=" operators', () => {
            test.each([
                [
                    "!=",
                    [["field", 4], "cam"],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" <> 'cam';`,
                ],
                [
                    "!=",
                    [["field", 4], 35],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" <> 35;`,
                ],

                [
                    "!=",
                    [["field", 4], 35, 44],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" NOT IN (35, 44);`,
                ],
                [
                    "!=",
                    [
                        ["field", 4],
                        ["field", 3],
                    ],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" <> "date_joined";`,
                ],
                [
                    "!=",
                    [["field", 4], null],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" IS NOT NULL;`,
                ],
            ])(
                "should correctly handle '%s' operator with '%j'",
                (operator, args, expectedSql) => {
                    const sql = toSQL("postgres" as Dialect, fields, {
                        where: [operator, ...args] as Condition,
                    });
                    expect(sql).toEqual(expectedSql);
                }
            );
        });

        describe('"is-empty/is-not-empty" operators', () => {
            test.each([
                [
                    "is-empty",
                    [["field", 4]],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" IS NULL;`,
                ],
                [
                    "not-empty",
                    [["field", 4]],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE "age" IS NOT NULL;`,
                ],
            ])(
                "should correctly handle '%s' operator with '%j'",
                (operator, args, expectedSql) => {
                    const sql = toSQL("postgres" as Dialect, fields, {
                        where: [operator, ...args] as Condition,
                    });
                    expect(sql).toEqual(expectedSql);
                }
            );
        });

        describe('"or/and" operators', () => {
            test.each([
                [
                    "and",
                    [
                        ["<", ["field", 1], 5],
                        ["=", ["field", 2], "joe"],
                    ],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("id" < 5) AND ("name" = 'joe');`,
                ],
                [
                    "or",
                    [
                        ["<", ["field", 1], 5],
                        ["=", ["field", 2], "joe"],
                    ],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("id" < 5) OR ("name" = 'joe');`,
                ],
                [
                    "and",
                    [
                        ["!=", ["field", 3], null],
                        [
                            "or",
                            [">", ["field", 4], 25],
                            ["=", ["field", 2], "Jerry"],
                        ],
                    ],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("date_joined" IS NOT NULL) AND (("age" > 25) OR ("name" = 'Jerry'));`,
                ],
            ])(
                "should correctly handle '%s' operator with '%j'",
                (operator, args, expectedSql) => {
                    const sql = toSQL("postgres" as Dialect, fields, {
                        where: [operator, ...args] as Condition,
                    });
                    expect(sql).toEqual(expectedSql);
                }
            );
        });

        describe('"not" operator', () => {
            test.each([
                [
                    ["<", ["field", 1], 5],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE NOT ("id" < 5);`,
                ],
                [
                    ["=", ["field", 2], "joe"],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE NOT ("name" = 'joe');`,
                ],
                [
                    [
                        "or",
                        [">", ["field", 4], 25],
                        ["=", ["field", 2], "Jerry"],
                    ],
                    `SELECT "id", "name", "date_joined", "age", * FROM data WHERE NOT (("age" > 25) OR ("name" = 'Jerry'));`,
                ],
            ])(
                "should correctly handle 'not' operator with '%j'",
                (args, expectedSql) => {
                    const sql = toSQL("postgres" as Dialect, fields, {
                        where: ["not", args] as Condition,
                    });
                    expect(sql).toEqual(expectedSql);
                }
            );
        });
    });

    describe("other", () => {
        test.each([
            [
                [
                    "and",
                    ["!=", ["field", 3], null],
                    [
                        "or",
                        [">", ["field", 4], 25],
                        ["=", ["field", 2], "Jerry"],
                    ],
                ],
                `SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("date_joined" IS NOT NULL) AND (("age" > 25) OR ("name" = 'Jerry'));`,
            ],
        ])("should handle %j", (where, expectedSql) => {
            const sql = toSQL("postgres" as Dialect, fields, {
                where: where,
            });
            expect(sql).toEqual(expectedSql);
        });
    });
});
