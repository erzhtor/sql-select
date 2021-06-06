import { Dialect, Fields, Arg, Condition, Query } from "./types";

export enum SQLDialects {
    SQL_SERVER = "sqlserver",
    POSTGRES = "postgres",
    MY_SQL = "mysql",
}

export default class SQLSelect {
    constructor(
        protected dialect: Dialect,
        protected fields: Fields,
        protected query?: Query
    ) {}

    protected columnToString = (column: string) => {
        const quote = this.dialect === SQLDialects.MY_SQL ? "`" : '"';
        return column !== "*" ? `${quote}${column}${quote}` : column;
    };

    protected parseArgument = (value: Arg) => {
        if (Array.isArray(value)) {
            const [, fieldId] = value;
            const column = this.fields[fieldId];
            return this.columnToString(column);
        }
        return typeof value !== "number" ? `'${value}'` : value;
    };

    protected handleCondition([operator, ...args]: Condition) {
        switch (operator) {
            case "not-empty":
                return `${this.parseArgument(args[0])} IS NOT NULL`;
            case "is-empty":
                return `${this.parseArgument(args[0])} IS NULL`;
            case "<":
            case ">":
                return args.map(this.parseArgument).join(` ${operator} `);
            case "=":
            case "!=":
                const fields = args.map(this.parseArgument);
                if (args.length > 2) {
                    return `${fields[0]} ${
                        operator === "!=" ? "NOT IN" : "IN"
                    } (${fields.slice(1).join(", ")})`;
                }
                if (args[1] === null) {
                    return `${fields[0]} ${
                        operator === "!=" ? "IS NOT NULL" : "IS NULL"
                    }`;
                }
                return `${fields[0]} ${operator === "!=" ? "<>" : "="} ${
                    fields[1]
                }`;
            case "and":
            case "or":
            case "not":
                const groups = args.map(this.handleCondition.bind(this));
                if (operator === "not") {
                    return `NOT (${groups})`;
                }
                return groups
                    .map((group) => `(${group})`)
                    .join(` ${operator.toUpperCase()} `);
            default:
                throw new Error(`Unknown operator "${operator}"`);
        }
    }

    public sql() {
        const getLimit = () => {
            if (!this.query?.limit) {
                return false;
            }
            const dialectLimit =
                this.dialect === SQLDialects.SQL_SERVER ? "TOP" : "LIMIT";
            return `${dialectLimit} ${this.query?.limit}`;
        };

        const getColumns = () =>
            Object.values(this.fields).map(this.columnToString).join(", ");

        const getWhere = () =>
            this.query?.where
                ? "WHERE " + this.handleCondition(this.query?.where)
                : false;

        const select = "SELECT";
        const from = "FROM " + (this.query?.table || "data");
        const columns = getColumns();
        const where = getWhere();
        const limit = getLimit();

        const filterAndJoin = (...tokens: any[]) =>
            tokens.filter(Boolean).join(" ");

        if (this.dialect === SQLDialects.SQL_SERVER) {
            return filterAndJoin(select, limit, columns, from, where) + ";";
        }

        return filterAndJoin(select, columns, from, where, limit) + ";";
    }
}
