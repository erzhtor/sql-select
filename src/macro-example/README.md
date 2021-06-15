

## Macro Support

[MacroSQLSelect](./macro.ts) example adds **macro support** on top of [SQLSelect](../index.ts)

### Examples

**1. Simple use case:**
```ts
import MacroSQLSelect from './macro'

const fields = {
    1: "id",
    2: "name",
    3: "date_joined",
    4: "age",
    5: "*",
};

const query = {
    where: ["and", ["<", ["field", 1], 5], ["macro", "is_joe"]],
    limit: 10,
    table: "data",
};

const macros = { is_joe: ["=", ["field", 2], "joe"] };

console.log(new MacroSQLSelect("postgres", fields, query, macros).sql());
// => SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("id" < 5) AND ("name" = 'joe') LIMIT 10;
```

**2. Nested macros**

```ts
const fields = {
    1: "id",
    2: "name",
    3: "date_joined",
    4: "age",
    5: "*",
};

const query = {
    where: ["and", ["<", ["field", 1], 5], ["macro", "is_old_joe"]],
};

const macros = {
    is_joe: ["=", ["field", 2], "joe"],
    is_old: [">", ["field", 4], 18],
    is_old_joe: ["and", ["macro", "is_joe"], ["macro", "is_old"]],
};

console.log(new MacroSQLSelect("postgres", fields, query, macros).sql());

// => SELECT "id", "name", "date_joined", "age", * FROM data WHERE ("id" < 5) AND (("name" = 'joe') AND ("age" > 18));
```

**3. Circular macros detection**

```ts
const macros = {
    is_adult: ["and", ["macro", "is_child"], [">", ["field", 4], 18]],
    is_child: ["and", ["macro", "is_adult"], ["<", ["field", 4], 5]],
};
const query = {
    where: ["and", ["<", ["field", 1], 5], ["macro", "is_adult"]],
};

console.log(new MacroSQLSelect("postgres", fields, query, macros).sql());
// => Error: Circular macros detected "is_adult->is_child->is_adult"
```