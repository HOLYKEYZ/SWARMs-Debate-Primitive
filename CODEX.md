# Global Codex Rules

Rules applied.

## Core principles

- always ground changes in the actual codebase, logs, tests, or browser evidence.
- do not guess at bugs, dependencies, APIs, or framework behavior when the code or current docs can verify it.
- prefer production-grade, maintainable fixes over shortcuts.
- avoid hardcoded configuration; use existing config files, environment variables, typed helpers, or framework conventions.
- keep comments lowercase and add them only when they clarify non-obvious logic.
- keep todo comments tied to explicit tracked tasks.
- search current docs when a dependency, platform rule, or api may be outdated.

## Codebase workflow

- start coding work by mapping the relevant files, call sites, runtime paths, and existing conventions.
- use fast search when available, and fall back to equivalent tools when unavailable.
- summarize findings before major edits when the implementation is broad or risky.
- preserve unrelated user changes in the worktree.

## Editing workflow

- make targeted edits that respect existing ownership boundaries.
- avoid overwriting whole files unless the file is small or the replacement is clearly safer than many fragile edits.
- split large work into verifiable increments.
- never remove existing behavior unless the task or evidence requires it.

## Verification workflow

- after backend changes, run syntax checks, focused tests, and relevant runtime checks.
- after frontend changes, run lint/build checks and verify the UI in a browser when a dev server is available.
- report real failures accurately and keep iterating until the project is in a demonstrably better state.
