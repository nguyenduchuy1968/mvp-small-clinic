# 08 — Roo Frontend Rules

> **Enforceable rules that Roo AI must follow during all frontend development tasks.**
>
> These rules govern how Roo AI behaves when implementing, modifying, or reviewing frontend code. They ensure Design System compliance, architectural integrity, and consistent output.

---

## 1. Purpose

This document defines the mandatory behavior for Roo AI when working on frontend tasks. It serves as:

- **The rulebook** — what Roo AI must and must not do
- **The enforcement mechanism** — how Design System compliance is guaranteed
- **The escalation path** — what to do when rules conflict with implementation

---

## 2. Mandatory Rules

### Rule 1: Read Design System First

**Before implementing any frontend task, Roo AI must read the relevant Design System documents.**

1. Start at [`00_INDEX.md`](./00_INDEX.md) to identify which documents apply
2. Read the identified documents in full
3. Reference the documents during implementation

### Rule 2: Do Not Guess UI

**Roo AI must not guess or invent UI elements.**

- If the Design System does not specify a UI element, ask for clarification
- Do not invent new components, layouts, colors, or patterns
- Do not assume visual behavior that is not documented

### Rule 3: Do Not Invent Components

**Roo AI must not create new components when existing ones suffice.**

- Check [`03_COMPONENT_LIBRARY.md`](./03_COMPONENT_LIBRARY.md) first
- Check [`frontend/src/components/ui/`](../src/components/ui/) for base components
- Check [`frontend/src/components/`](../src/components/) for domain components
- Only create a new component if no existing component can fulfill the requirement

### Rule 4: Do Not Invent Layouts

**Roo AI must use existing layout patterns.**

- Use [`Container`](../src/components/ui/Container.tsx) for page-level width constraints
- Use [`PageHeader`](../src/components/ui/PageHeader.tsx) for page headers
- Use [`SectionHeader`](../src/components/ui/SectionHeader.tsx) for section titles
- Follow the responsive breakpoints defined in the theme

### Rule 5: Do Not Invent Colors

**Roo AI must use theme tokens for all colors.**

- All colors must come from [`02_COLOR_SYSTEM.md`](./02_COLOR_SYSTEM.md)
- Use CSS variables (`var(--primary)`, `var(--background)`, etc.)
- Use Tailwind utility classes that map to theme tokens (`bg-primary`, `text-foreground`, etc.)
- Never hardcode color values (`#14B8A6`, `bg-teal-500`, `text-gray-500`)

### Rule 6: Reuse Existing Product UI Components

**Roo AI must reuse existing Product UI Library components.**

- Use [`Button`](../src/components/ui/button.tsx) for all buttons
- Use [`Input`](../src/components/ui/input.tsx) for all text inputs
- Use [`Card`](../src/components/ui/card.tsx) for all card containers
- Use [`Badge`](../src/components/ui/badge.tsx) for all status badges
- Use [`Dialog`](../src/components/ui/dialog.tsx) for all modals
- Use [`Table`](../src/components/ui/table.tsx) for all data tables
- Use [`form.tsx`](../src/components/ui/form.tsx) for all form layouts

### Rule 7: Report Conflicts

**If documentation and implementation conflict, Roo AI must stop and report.**

1. **Stop** — do not proceed with implementation
2. **Report** — document the conflict clearly, citing the specific documents and code involved
3. **Do not silently invent** — do not create an undocumented solution

### Rule 8: Verify Design System Compliance

**After implementation, Roo AI must verify compliance.**

- Check that no hardcoded colors were introduced
- Check that no duplicated components were created
- Check that all UI elements use the Product UI Library
- Check that all text uses translation keys
- Check that both light and dark modes work
- Check that responsive behavior is correct

---

## 3. Enforcement

These rules are enforced through the following mechanisms:

| Mechanism              | Description                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **Self-review**        | Roo AI must review its own output against these rules before presenting results                |
| **Frontend Checklist** | The checklist in [`09_DEVELOPMENT_WORKFLOW.md`](./09_DEVELOPMENT_WORKFLOW.md) must be verified |
| **Build verification** | `npm run build` must pass without errors                                                       |
| **UI audit**           | Visual consistency must be confirmed                                                           |

---

## 4. Escalation

If Roo AI cannot comply with these rules due to:

- Missing Design System documentation
- Conflicting requirements
- Ambiguous specifications

Then Roo AI must:

1. **Stop** all implementation work
2. **Document** the specific issue with references
3. **Request clarification** from the user or team lead
4. **Wait** for resolution before proceeding

---

## 5. Cross-References

- [`00_INDEX.md`](./00_INDEX.md) — Design System index and navigation
- [`02_COLOR_SYSTEM.md`](./02_COLOR_SYSTEM.md) — color tokens and theme definitions
- [`03_COMPONENT_LIBRARY.md`](./03_COMPONENT_LIBRARY.md) — reusable UI component catalog
- [`09_DEVELOPMENT_WORKFLOW.md`](./09_DEVELOPMENT_WORKFLOW.md) — standard frontend workflow and checklist

---

_Last updated: Sprint 7.7_
