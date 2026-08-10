<!--
Sync Impact Report
- Version change: template -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Code Quality Is Mandatory
  - Template Principle 2 -> II. Tests Prove Behavior
  - Template Principle 3 -> III. User Experience Must Stay Consistent
  - Template Principle 4 -> IV. Performance Is a Product Requirement
  - Template Principle 5 -> V. Maintainable Python Over Cleverness
- Added sections:
  - Engineering Standards
  - Delivery Workflow & Quality Gates
- Removed sections:
  - None
- Follow-up TODOs:
  - None
-->

# SapperProposalAssistant Constitution

## Core Principles

### I. Code Quality Is Mandatory
All production changes MUST be small, readable, typed where practical, and reviewed for
clarity, correctness, and security. Functions and modules MUST have a single clear purpose,
duplicate logic MUST be reduced, and public behavior MUST be explicit rather than implied.
Quick fixes that increase ambiguity, hidden coupling, or silent failure modes are not
acceptable.

Rationale: proposal generation is trust-sensitive, so maintainers must be able to understand
and verify how inputs become outputs.

### II. Tests Prove Behavior
Every change that affects behavior MUST include or update automated tests at the appropriate
level. Unit tests MUST cover decision logic and edge cases, integration tests MUST cover
component boundaries, and regression tests MUST be added for defects that previously escaped.
Code may not be merged when required tests are missing or failing.

Rationale: assistant workflows depend on prompt assembly, validation, and output formatting that
can regress silently without executable checks.

### III. User Experience Must Stay Consistent
User-facing behavior MUST be predictable across commands, prompts, validations, and generated
proposal content. Terminology, formatting, error messages, and recovery guidance MUST follow
the same patterns across the product, and new features MUST not introduce conflicting workflows
or surprising defaults. Changes that affect output structure MUST preserve backwards-compatible
expectations unless the change is explicitly approved.

Rationale: proposal assistants succeed when users can trust the interaction model and the shape
of generated results.

### IV. Performance Is a Product Requirement
Features MUST preserve responsive local interactions and efficient proposal generation under
normal workloads. Expensive operations MUST be measured, bounded, or deferred; repeated work
MUST be cached or eliminated when practical; and large-input paths MUST be evaluated for
latency and memory impact before release. Performance regressions that degrade the core user
flow are release blockers.

Rationale: assistants lose usefulness quickly when generation, validation, or feedback loops
feel slow or unpredictable.

### V. Maintainable Python Over Cleverness
Python code MUST prioritize readability, explicitness, and maintainability over novelty.
Implementations MUST follow current Python best practices: use descriptive names, type hints,
standard-library features before custom abstractions, structured data models, explicit error
handling, and dependency scopes that remain easy to upgrade. Hidden side effects, overly dynamic
metaprogramming, and tightly coupled modules SHOULD be avoided unless a clear, documented need
exists.

Rationale: this repository is a proposal assistant, so its long-term value depends on Python
code that future contributors can safely extend and debug.

## Engineering Standards

- Python code MUST target a single clear execution path per responsibility and keep I/O,
  business rules, and presentation concerns separated.
- Public modules, service boundaries, and data contracts MUST use type hints and stable schemas.
- Configuration MUST be explicit, environment-driven where appropriate, and validated early.
- Logging and errors MUST provide actionable debugging context without leaking secrets or user
  content unnecessarily.
- Dependencies MUST be justified, actively maintained, and introduced only when simpler standard
  approaches are insufficient.

## Delivery Workflow & Quality Gates

- Work MUST begin with clear acceptance criteria for proposal behavior, validation rules, and
  user-visible output changes.
- Pull requests MUST document affected behaviors, test coverage, and any performance or UX trade
  offs.
- Reviewers MUST check compliance with all constitution principles, with special attention to
  Python readability, test completeness, and UX consistency.
- Merges require all relevant automated checks to pass and any known regressions to be resolved
  or explicitly waived by maintainers.
- Release-impacting changes to proposal formats, prompts, or generated artifacts MUST include a
  migration or compatibility note when user expectations could change.

## Governance

This constitution overrides conflicting local habits and serves as the default standard for
planning, implementation, review, and release decisions in this repository.

- Amendments MUST be proposed in writing, reviewed by maintainers, and merged with an explanation
  of the rationale, affected principles, and any required transition steps.
- Constitution versioning MUST follow semantic versioning:
  - MAJOR for incompatible governance or principle changes.
  - MINOR for new principles, sections, or materially stronger guidance.
  - PATCH for clarifications, wording improvements, and non-semantic refinements.
- Every pull request review MUST include an explicit constitution compliance check.
- When a change conflicts with this constitution, the constitution MUST be amended first or the
  change MUST be rejected.

**Version**: 1.0.0 | **Ratified**: 2026-08-10 | **Last Amended**: 2026-08-10
