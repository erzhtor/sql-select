# SQLSelect
JavaScript/TypeScript based SQL SELECT generator

#### Table of contents:
- [Getting Started](#getting-started)
- [Running Locally](#running-locally)
- [Extending Functionality](#extending-functionality)
- [Tech Stack](#tech-stack)
- [License](./LICENSE.md)

### Getting Started

```ts
import SQLSelect from ".";

const fields = {
    1: "id",
    2: "name",
    3: "date_joined",
    4: "age",
    5: "*",
};

const query = {
    where: ["and", ["=", ["field", 2], "john"], [">", ["field", 4], 18]],
    limit: 10,
    table: "data",
};

new SQLSelect("postgres", fields, query).sql()
// => SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("name" = 'john') AND ("age" > 18) LIMIT 10;
```

**Alternative/functional usage:**

```ts
import SQLSelect from ".";
import { Dialect, Fields, Query } from "./types";

const toSQL = (dialect: Dialect, fields: Fields, query?: Query) =>
    new SQLSelect(dialect, fields, query).sql();

const query = { where: ["=", ["field", 2], "cam"], limit: 10, table: "data" };

toSql("postgres", field, query);
// => SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("name" = 'john') AND ("age" > 18) LIMIT 10;
```
### Running locally

- `yarn install`: install dependencies 
- `yarn start`: run example.ts file

**Testing**
- `yarn test` or `yarn test --watch`

### Extending functionality:

```ts
import SQLSelect from ".";
import { Condition, Operator } from "./types";

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

const query = {
    where: ["xor", ["!=", ["field", 3], 35], ["like", ["field", 2], "%cam%"]],
    limit: 10,
    table: "data",
};

new ExtendedSQLSelect("postgres", fields, query).sql();
// => SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("date_joined" <> 35) XOR ("name" LIKE '%cam%') LIMIT 10;
```

### [Macro Support Example](./macro-support/README.md)

## Tech Stack:
- **TypeScript**
- **Jest** for testing

