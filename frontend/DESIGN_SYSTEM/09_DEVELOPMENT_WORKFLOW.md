# 09 — Development Workflow

> **Mandatory workflow for all frontend development tasks.**
>
> This document defines the standard process that every frontend sprint and task must follow. It ensures consistency, Design System compliance, and architectural integrity.

---

## 1. Purpose

The Development Workflow document serves as:

- **The process** — the mandatory sequence of steps for every frontend task
- **The checklist** — reusable verification items that must pass before completion
- **The governance model** — rules for how the Design System evolves over time
- **The quality gate** — criteria that must be met before code is committed

**Every frontend implementation must follow this workflow.** No exceptions.

---

## 2. Standard Frontend Workflow

Every frontend task — whether a new feature, a bug fix, or a refactor — must follow this exact sequence:

```
Business Requirements
        │
        ▼
Architecture Review
        │
        ▼
Read Design System Documents
        │
        ▼
Review Existing Components
        │
        ▼
Reuse Existing Components
        │
        ▼
Implement
        │
        ▼
Self Review
        │
        ▼
UI Audit
        │
        ▼
Testing
        │
        ▼
Git Commit
        │
        ▼
Tag Release
```

### 2.1 Step Details

#### Step 1: Read Business Requirements

Understand the business problem before writing any code.

- Read the sprint requirements or task description
- Clarify ambiguities with the product owner or team lead
- Identify which parts of the application are affected

#### Step 2: Architecture Review

Understand the existing architecture.

- Read relevant architecture documents in [`docs/`](../docs/)
- Review the data model and API contracts
- Identify which routes, hooks, and services are involved
- Confirm no backend or API changes are needed (unless explicitly required)

#### Step 3: Read Design System Documents

Consult the Design System before making any UI decisions.

- Start at [`00_INDEX.md`](./00_INDEX.md) to identify relevant documents
- Read [`02_COLOR_SYSTEM.md`](./02_COLOR_SYSTEM.md) for color tokens
- Read [`03_COMPONENT_LIBRARY.md`](./03_COMPONENT_LIBRARY.md) for available components
- Read any other relevant Design System documents (layout, booking UI, mobile, accessibility)
- Read [`08_ROO_FRONTEND_RULES.md`](./08_ROO_FRONTEND_RULES.md) for enforceable rules

**Do not guess UI. Do not invent components. Do not invent layouts. Do not invent colors.**

#### Step 4: Review Existing Components

Check whether an existing component already solves the problem.

- Search the component library in [`03_COMPONENT_LIBRARY.md`](./03_COMPONENT_LIBRARY.md)
- Check [`frontend/src/components/ui/`](../src/components/ui/) for base components
- Check [`frontend/src/components/`](../src/components/) for domain-specific components
- Check [`frontend/src/hooks/`](../src/hooks/) for existing hooks

#### Step 5: Reuse Existing Components

Reuse existing components whenever possible.

- Prefer composition over custom implementation
- Extend existing components via props rather than creating new variants
- If a component doesn't exist, consider if an existing one can be adapted
- Only create a new component if no existing component can fulfill the requirement

#### Step 6: Implement

Write code following Design System specifications.

- Use theme tokens for all colors (no hardcoded colors)
- Use the Product UI Library for all UI elements
- Use translation keys for all user-facing text
- Follow responsive design patterns
- Ensure keyboard navigation works
- Test both light and dark modes

#### Step 7: Self Review

Verify your implementation against the Frontend Checklist (see Section 3).

- Check all checklist items
- Run the build to ensure no errors
- Review your own code for consistency

#### Step 8: UI Audit

Perform a visual consistency review.

- Compare your implementation with existing pages
- Verify colors match the color system
- Verify components match the component library
- Check responsive behavior at all breakpoints
- Check both light and dark modes
- Verify localization works for all supported languages

#### Step 9: Testing

Run all relevant tests.

- Run `npm run build` to verify compilation
- Run `npm run test` or equivalent test suite
- Manually test the affected flows
- Verify edge cases (loading, empty, error states)

#### Step 10: Git Commit

Commit code following project conventions.

- Write clear, descriptive commit messages
- Reference the task or issue number
- Keep commits focused and atomic

#### Step 11: Tag Release

Tag the release following semantic versioning.

- Update release notes if applicable
- Tag with appropriate version number

---

## 3. Frontend Checklist

Every frontend task **must** verify all of the following before completion:

### 3.1 Architecture

- ☐ No backend changes
- ☐ No API changes
- ☐ No new dependencies without justification

### 3.2 Component Reuse

- ☐ No duplicated components
- ☐ No duplicated layouts
- ☐ Existing components reused where possible
- ☐ New components only when no existing component fits

### 3.3 Design System Compliance

- ☐ No hardcoded colors (use theme tokens)
- ☐ No hardcoded text (use translation keys)
- ☐ Uses theme tokens from [`02_COLOR_SYSTEM.md`](./02_COLOR_SYSTEM.md)
- ☐ Uses Product UI Library from [`03_COMPONENT_LIBRARY.md`](./03_COMPONENT_LIBRARY.md)

### 3.4 Responsive Design

- ☐ Responsive layout at all breakpoints
- ☐ Mobile-first approach
- ☐ Touch targets adequate on mobile (≥44px)

### 3.5 Theme Support

- ☐ Dark Mode renders correctly
- ☐ Light Mode renders correctly
- ☐ No hardcoded light-only or dark-only colors

### 3.6 Localization

- ☐ All user-facing text uses translation keys
- ☐ Text expansion/contraction handled in layouts
- ☐ Right-to-left (RTL) not broken (if applicable)

### 3.7 Accessibility

- ☐ Keyboard navigation works
- ☐ Focus indicators visible
- ☐ Screen reader labels present
- ☐ Color not used as sole indicator of meaning

### 3.8 Build & Quality

- ☐ Build passes (`npm run build`)
- ☐ No TypeScript errors
- ☐ No lint warnings introduced

---

## 4. Design System Governance

### 4.1 Source of Truth

The Design System is the **single source of truth** for all UI decisions.

- All colors must come from [`02_COLOR_SYSTEM.md`](./02_COLOR_SYSTEM.md)
- All components must come from [`03_COMPONENT_LIBRARY.md`](./03_COMPONENT_LIBRARY.md)
- All layouts must follow the layout rules
- All UI decisions must be documented before implementation

### 4.2 Documentation First

**Implementation follows documentation. Documentation does not follow implementation.**

- Any architectural UI change must update the Design System **first**
- Write or update the Design System document before writing application code
- If documentation and implementation conflict, the documentation takes precedence
- Do not silently invent a new solution when documentation is unclear — report the conflict

### 4.3 Change Process

The Design System evolves through a controlled process:

1. **Propose** — describe the proposed change and its rationale
2. **Review** — get approval from the team lead or architect
3. **Document** — update the relevant Design System document(s)
4. **Implement** — write application code following the updated documentation
5. **Verify** — confirm the implementation matches the documentation

### 4.4 What Requires a Design System Update

The following changes **must** update the Design System first:

- Adding or changing color tokens
- Adding or modifying reusable components
- Changing layout rules or grid system
- Changing booking UI patterns
- Changing mobile behavior
- Changing accessibility requirements
- Adding new Design System documents

### 4.5 What Does NOT Require a Design System Update

The following changes typically do **not** require a Design System update:

- Bug fixes that don't change visual appearance
- Performance optimizations
- Refactoring that preserves visual output
- Adding tests

### 4.6 Stability Rule

Do not change architecture during feature implementation unless explicitly requested.

- A feature task is not the time to redesign the color system
- A bug fix is not the time to restructure the component library
- If an architectural issue is discovered during implementation, log it separately — do not fix it inline

---

## 5. Conflict Resolution

If documentation and implementation conflict:

1. **Stop** — do not proceed with implementation
2. **Report** — document the conflict clearly
3. **Resolve** — determine whether the documentation or the implementation is correct
4. **Update** — fix whichever is wrong (documentation or code)
5. **Proceed** — continue only after resolution

**Do not silently invent a new solution.** If you encounter a gap in the Design System, report it rather than inventing an undocumented approach.

---

## 6. Cross-References

- [`00_INDEX.md`](./00_INDEX.md) — Design System index and navigation
- [`02_COLOR_SYSTEM.md`](./02_COLOR_SYSTEM.md) — color tokens and theme definitions
- [`03_COMPONENT_LIBRARY.md`](./03_COMPONENT_LIBRARY.md) — reusable UI component catalog
- [`08_ROO_FRONTEND_RULES.md`](./08_ROO_FRONTEND_RULES.md) — Roo AI coding rules

---

_Last updated: Sprint 7.7_
