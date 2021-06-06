import { SQLDialects } from ".";

export type Field = ["field", number];

export type Condition = [Operator, ...any];

export type Operator =
    | "and"
    | "or"
    | "not"
    | "<"
    | ">"
    | "="
    | "!="
    | "is-empty"
    | "not-empty";

export type Arg = Field | string | number | null;

export type Args = [Field, (Arg | Arg[])?];

export type Query = { where?: any; limit?: number; table?: string };

export type Fields = { [key: string]: string };

export type Dialect = `${SQLDialects}`;
