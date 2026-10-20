import { describe, expect, it } from "vitest";

import {
  extractTypeScriptImports,
  validateCuratedExports,
  validatePackageDependencies,
  validateSubsystemArchitecture,
} from "./check-package-boundaries.mjs";

describe("workspace dependency direction", () => {
  it("rejects a workspace dependency from core", () => {
    expect(validatePackageDependencies({
      "@conceptor/core": ["@conceptor/runtime"],
      "@conceptor/runtime": ["@conceptor/core"],
    })).toContain("@conceptor/core must not depend on @conceptor/runtime");
  });

  it("accepts the declared ports-and-composition-root graph", () => {
    expect(validatePackageDependencies({
      "@conceptor/core": [],
      "@conceptor/engine": ["@conceptor/core"],
      "@conceptor/analyzers": ["@conceptor/core"],
      "@conceptor/runtime": ["@conceptor/core"],
      "@conceptor/integrations": ["@conceptor/core", "@conceptor/engine"],
      "@conceptor/control-plane": ["@conceptor/core", "@conceptor/engine", "@conceptor/analyzers", "@conceptor/runtime"],
      "@conceptor/cli": [
        "@conceptor/core",
        "@conceptor/engine",
        "@conceptor/analyzers",
        "@conceptor/runtime",
        "@conceptor/integrations",
        "@conceptor/control-plane",
      ],
    })).toEqual([]);
  });
});

describe("TypeScript-aware public composition", () => {
  it("reads imports from syntax, not comments or string fragments", () => {
    expect(extractTypeScriptImports(`
      // import { fake } from "@conceptor/runtime";
      const text = 'from "@conceptor/engine"';
      import { RepositoryChangeLifecycleService } from "@conceptor/control-plane";
    `)).toEqual(["@conceptor/control-plane"]);
  });

  it("requires the exact curated control-plane facade", () => {
    const source = `export { RepositoryChangeLifecycleService, type LifecycleRecoveryOutcome } from "./change-lifecycle/service.js";`;
    expect(validateCuratedExports(source, ["LifecycleRecoveryOutcome", "RepositoryChangeLifecycleService"])).toEqual([]);
    expect(validateCuratedExports(`${source}\nexport * from "./change-lifecycle/store.js";`, ["LifecycleRecoveryOutcome", "RepositoryChangeLifecycleService"])).toContain("curated facade must not use export-star declarations");
  });
});

describe("subsystem architecture closure", () => {
  it("rejects parallel renderers and every severed representation composition edge", () => {
    const complete = {
      context: "const semanticContextOnly = true;",
      planning: "const representation = ports.representations.compile(change);",
      host: "authenticateRepresentationBinding(input);",
      session: "input.capsule.representation; input.instructions.representation; hashFramedDomain(\"representation-artifact\", input.instructions.text);",
      coverage: "const reason = 'authenticated representation projection evidence';",
    };
    expect(validateSubsystemArchitecture(complete)).toEqual([]);
    for (const key of ["planning", "host", "session", "coverage"] as const) expect(validateSubsystemArchitecture({ ...complete, [key]: "severed" }).join("\n")).toMatch(/planning|host|session|coverage/iu);
    expect(validateSubsystemArchitecture({ ...complete, context: "deriveBehaviorViews(); const profile = 'agent-compact';" }).join("\n")).toMatch(/parallel.*renderer|context/iu);
  });
});
