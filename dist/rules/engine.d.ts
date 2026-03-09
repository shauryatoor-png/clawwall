import type { PolicyRequest, PolicyDecision, CustomRules } from "./types.js";
export declare function evaluate(req: PolicyRequest, custom?: CustomRules): PolicyDecision;
/** Return the list of built-in rules for display. */
export declare function getBuiltInRules(): Array<{
    description: string;
    decision: string;
    tools: string;
}>;
