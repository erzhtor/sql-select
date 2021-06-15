import SQLSelect from "..";
import { Condition, Operator } from "../types";
import { Dialect, Fields, Query } from "../types";

export default class MacroSQLSelect extends SQLSelect {
    protected macroIds = new Set();
    constructor(
        protected dialect: Dialect,
        protected fields: Fields,
        protected query?: Query,
        protected macros?: any
    ) {
        super(dialect, fields, query);
    }

    protected handleCondition([operator, ...args]: Condition) {
        if (operator === ("macro" as Operator)) {
            const macroId = args[0];
            if (this.macroIds.has(macroId)) {
                const chain = [...Array.from(this.macroIds), macroId].join(
                    "->"
                );
                throw new Error(`Circular macros detected "${chain}"`);
            }
            this.macroIds.add(macroId);
            const macro = this.macros?.[macroId];
            const result = this.handleCondition(macro);
            this.macroIds.delete(macroId);
            return result;
        }

        return super.handleCondition([operator, ...args]);
    }
}
