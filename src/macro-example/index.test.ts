import MacroSQLSelect from ".";
import { Dialect, Fields, Query } from "../types";

const toSQL = (dialect: Dialect, fields: Fields, query?: Query, macros?: any) =>
    new MacroSQLSelect(dialect, fields, query, macros).sql();

describe("macro", () => {
    const fields = {
        1: "id",
        2: "name",
        3: "date_joined",
        4: "age",
        5: "*",
    };

    describe("simple macros", () => {
        test.each([
            [
                "mysql",
                "SELECT `id`, `name`, `date_joined`, `age`, * FROM data WHERE (`id` < 5) AND (`name` = 'joe');",
            ],
            [
                "postgres",
                `SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("id" < 5) AND ("name" = 'joe');`,
            ],
            [
                "sqlserver",
                `SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("id" < 5) AND ("name" = 'joe');`,
            ],
        ])(
            "should correctly handle macros for '%s'",

            (dialect, expectedSql) => {
                const macros = { is_joe: ["=", ["field", 2], "joe"] };
                const query = {
                    where: ["and", ["<", ["field", 1], 5], ["macro", "is_joe"]],
                };
                const sql = toSQL(dialect as Dialect, fields, query, macros);
                expect(sql).toEqual(expectedSql);
            }
        );
    });

    describe("nested macros", () => {
        test.each([
            [
                "mysql",
                "SELECT `id`, `name`, `date_joined`, `age`, * FROM data WHERE (`id` < 5) AND ((`name` = 'joe') AND (`age` > 18));",
            ],
            [
                "postgres",
                `SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("id" < 5) AND (("name" = 'joe') AND ("age" > 18));`,
            ],
            [
                "sqlserver",
                `SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("id" < 5) AND (("name" = 'joe') AND ("age" > 18));`,
            ],
        ])(
            "should correctly handle multiple usage of the same macro",

            (dialect, expectedSql) => {
                const query = {
                    where: [
                        "and",
                        ["<", ["field", 1], 5],
                        ["macro", "is_old_joe"],
                    ],
                };

                const macros = {
                    is_joe: ["=", ["field", 2], "joe"],
                    is_old: [">", ["field", 4], 18],
                    is_old_joe: [
                        "and",
                        ["macro", "is_joe"],
                        ["macro", "is_old"],
                    ],
                };
                expect(
                    toSQL(dialect as Dialect, fields, query, macros)
                ).toEqual(expectedSql);
            }
        );
    });

    describe("circular macros", () => {
        test.each([["mysql"], ["postgres"], ["sqlserver"]])(
            "should throw error for circular macros",
            (dialect) => {
                const macros = {
                    is_adult: [
                        "and",
                        ["macro", "is_decent"],
                        [">", ["field", 4], 18],
                    ],
                    is_child: [
                        "and",
                        ["macro", "is_good"],
                        ["<", ["field", 4], 5],
                    ],
                };
                const query = {
                    where: [
                        "and",
                        ["<", ["field", 1], 5],
                        ["macro", "is_adult"],
                    ],
                };
                expect(() => {
                    toSQL(dialect as Dialect, fields, query, macros);
                }).toThrow();
            }
        );

        test.each([
            [
                "mysql",
                "SELECT `id`, `name`, `date_joined`, `age`, * FROM data WHERE ((`age` > 18)) AND ((`age` > 18));",
            ],
            [
                "postgres",
                `SELECT "id", "name", "date_joined", "age", * FROM data WHERE (("age" > 18)) AND (("age" > 18));`,
            ],
            [
                "sqlserver",
                `SELECT "id", "name", "date_joined", "age", * FROM data WHERE (("age" > 18)) AND (("age" > 18));`,
            ],
        ])(
            "should correctly handle multiple usage of the same macro",

            (dialect, expectedSql) => {
                const macros = {
                    is_adult: ["and", [">", ["field", 4], 18]],
                };
                const query = {
                    where: [
                        "and",
                        ["macro", "is_adult"],
                        ["macro", "is_adult"],
                    ],
                };
                expect(
                    toSQL(dialect as Dialect, fields, query, macros)
                ).toEqual(expectedSql);
            }
        );
    });
});
