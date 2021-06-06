import SQLSelect from ".";
import { Condition, Operator } from "./types";
import { Dialect, Fields, Query } from "./types";

const fields = {
    1: "id",
    2: "name",
    3: "date_joined",
    4: "age",
    5: "*",
};

let query = {
    where: ["and", ["=", ["field", 2], "john"], [">", ["field", 4], 18]],
    limit: 10,
    table: "data",
};

/* ============================= FUNCTIONAL USAGE ============================= */
console.log(new SQLSelect("postgres", fields, query).sql())

/* ============================= FUNCTIONAL USAGE ============================= */

const toSQL = (dialect: Dialect, fields: Fields, query?: Query) =>
    new SQLSelect(dialect, fields, query).sql();

console.log(toSQL("postgres", fields, query))

/* ============================= EXTENDING FUNCTIONALITY ============================= */
class ExtendedSQLSelect extends SQLSelect {
    protected handleCondition([operator, ...args]: Condition) {
        if (operator === ("xor" as Operator)) {
            return args
                .map(this.handleCondition.bind(this))
                .map((group) => `(${group})`)
                .join(" XOR ");
        }

        if (operator === ("like" as Operator)) {
            return args.map(this.parseArgument.bind(this)).join(" LIKE ");
        }
        return super.handleCondition([operator, ...args]);
    }
}

query = {
    where: ["xor", ["!=", ["field", 3], 35], ["like", ["field", 2], "%cam%"]],
    limit: 10,
    table: "data",
};

console.log(new ExtendedSQLSelect("postgres", fields, query).sql());