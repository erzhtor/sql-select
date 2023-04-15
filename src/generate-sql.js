const compose =
    (...fns) =>
    (...args) =>
        fns.reduceRight((result, fn) => [fn.apply(null, result)], args)[0];

const equal = ({ operator, parseArgument }) => {
    const [, ...args] = operator;
    const items = args.map((item) => parseArgument(item));
    if (items.length == 2) {
        return `${items[0]} EQUALS ${items[1]}`;
    }
    return `${items[0]} IN (${items.slice(1).join(", ")})`;
};

export const forOperator = (symbol, fn) => (options) => {
    const { operator } = options;
    if (operator && operator[0] === symbol) {
        return fn(options);
    }
    return options;
};

export const generateSQL = ({ dialect, fields, query = {}, handlers = [] }) => {
    const columnToString = (column) => {
        if (column === "*") {
            return column;
        }
        const wrapper = dialect === "mysql" ? "`" : '"';
        return `${wrapper}${column}${wrapper}`;
    };

    const parseArgument = (value) => {
        if (!Array.isArray(value)) {
            return typeof value !== "number" ? `'${value}'` : value;
        }
        const [, fieldId] = value;
        const column = fields[fieldId];
        return columnToString(column);
    };

    const handleOperator = compose(...handlers, forOperator("=", equal));

    const { where, limit } = query;

    const tokens = [
        "SELECT " + Object.values(fields).map(columnToString).join(", "),
        limit && dialect === "sqlserver" && `TOP ${limit}`,
        "FROM data",
        where &&
            "WHERE " +
                handleOperator({
                    operator: where,
                    handleOperator,
                    parseArgument,
                }),
        limit && dialect !== "sqlserver" && `LIMIT ${limit}`,
    ];

    return tokens.filter(Boolean).join(" ");
};

// EXAMPLES

const fields = {
    1: "id",
    2: "name",
    3: "date_joined",
    4: "age",
    5: "*",
};

const query = {
    where: ["and", ["=", ["field", 2], "john"], ["=", ["field", 4], 18]],
    limit: 10,
    table: "data",
};

const and = ({ operator, handleOperator, ...rest }) => {
    const conditions = operator
        .slice(1)
        .map(
            (item) =>
                "(" +
                handleOperator({ operator: item, handleOperator, ...rest }) +
                ")"
        );
    return conditions.join(" AND ");
};

generateSQL({
    dialect: "sqlserver",
    fields,
    query,
    handlers: [forOperator("and", and)],
}); // ?
