# RTC Provider Package Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class TypeScript provider package loader and installer SPI so official RTC provider packages can be resolved, loaded, and installed by standard contract.

**Architecture:** Keep `RtcDriverManager` focused on registration and selection. Introduce a new package-loading layer above the assembly-driven provider package catalog and below existing provider-module registration. Use caller-supplied loaders so the SPI stays runtime agnostic and package-boundary friendly.

**Tech Stack:** TypeScript ESM, Node test runner, assembly-driven RTC workspace materializer and verifier

---

### Task 1: Add The Provider Package Loader Surface

**Files:**
- Create: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts`
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/provider-package-catalog.ts`
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/index.ts`
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/types.ts`

- [ ] **Step 1: Add package-identity lookup support to the provider package catalog**

- [ ] **Step 2: Define loader request, loader function, and loaded-module namespace contracts**

- [ ] **Step 3: Implement package target resolution by `providerKey` and `packageIdentity`**

- [ ] **Step 4: Implement provider-module loading and export extraction**

- [ ] **Step 5: Export the new SPI from the root TypeScript entrypoint**

### Task 2: Add Standard Installer Behavior

**Files:**
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/provider-package-loader.ts`
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/src/errors.ts`

- [ ] **Step 1: Add stable package-loading error codes and messages**

- [ ] **Step 2: Implement single package installation on top of `registerRtcProviderModule(...)`**

- [ ] **Step 3: Implement atomic batch package installation on top of `registerRtcProviderModules(...)`**

- [ ] **Step 4: Keep builtin and package-boundary providers on the same install contract**

### Task 3: Update Documentation And Verification Rules

**Files:**
- Modify: `sdks/sdkwork-rtc-sdk/README.md`
- Modify: `sdks/sdkwork-rtc-sdk/docs/provider-adapter-standard.md`
- Modify: `sdks/sdkwork-rtc-sdk/docs/package-standards.md`
- Modify: `sdks/sdkwork-rtc-sdk/bin/materialize-sdk.mjs`
- Modify: `sdks/sdkwork-rtc-sdk/bin/verify-sdk.mjs`

- [ ] **Step 1: Document the new loader and installer SPI in the root README**

- [ ] **Step 2: Document loader responsibilities and package-boundary semantics in provider-adapter standard**

- [ ] **Step 3: Document the new exported helpers in package standards**

- [ ] **Step 4: Update materialized docs to index the new source file**

- [ ] **Step 5: Update verifier expectations so the new SPI becomes mandatory standard surface**

### Task 4: Add Focused Regression Coverage

**Files:**
- Create: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/test/provider-package-loader.test.mjs`
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/test/provider-package-manifests.test.mjs`

- [ ] **Step 1: Add a loader fixture that imports provider packages through their package boundary**

- [ ] **Step 2: Verify loading by `providerKey`**

- [ ] **Step 3: Verify loading by `packageIdentity`**

- [ ] **Step 4: Verify atomic batch installation**

- [ ] **Step 5: Verify stable failure semantics for missing packages or missing exported module symbols**

### Task 5: Re-Materialize And Verify

**Files:**
- Modify: `sdks/sdkwork-rtc-sdk/docs/README.md`
- Modify: `sdks/sdkwork-rtc-sdk/sdkwork-rtc-sdk-typescript/README.md`

- [ ] **Step 1: Run RTC workspace materialization**

Run: `node .\sdks\sdkwork-rtc-sdk\bin\materialize-sdk.mjs`
Expected: Either “materialization already up to date” or a list of updated standard assets

- [ ] **Step 2: Run RTC workspace verification**

Run: `node .\sdks\sdkwork-rtc-sdk\bin\verify-sdk.mjs`
Expected: `[sdkwork-rtc-sdk] verification passed`

- [ ] **Step 3: Run TypeScript RTC package tests**

Run: `node .\sdks\sdkwork-rtc-sdk\sdkwork-rtc-sdk-typescript\bin\package-task.mjs test`
Expected: all RTC TypeScript tests pass

- [ ] **Step 4: Run RTC full smoke regression if the TypeScript layer and verifier are green**

Run: `node .\sdks\sdkwork-rtc-sdk\bin\smoke-sdk.mjs`
Expected: required RTC steps pass; optional language steps may pass or be skipped by missing toolchains

- [ ] **Step 5: Commit the RTC submodule changes**

```bash
git -C sdks/sdkwork-rtc-sdk add .
git -C sdks/sdkwork-rtc-sdk commit -m "feat: standardize rtc provider package loading"
```

- [ ] **Step 6: Update the parent repo submodule pointer if the submodule commit changed**

```bash
git add sdks/sdkwork-rtc-sdk
git commit -m "chore(sdks): update rtc sdk submodule"
```
