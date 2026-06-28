Frontend Design System

01 UI Guide
02 Color System
03 Components
04 Layout
05 Booking
06 Mobile
07 Accessibility
08 Roo Rules


=============================

01_UI_GUIDE.md

This is the most important document.

Everything else will reference it.

Below is the structure I recommend (don't write it all at once—we'll build it section by section).

1. Vision

Example topics

HealthClinic Product UI Guide

Purpose

Create a premium medical SaaS interface that is:

• Professional
• Friendly
• Fast
• Calm
• Modern
• Mobile-first
• Accessible

The UI should inspire confidence while remaining easy to use for patients,
doctors and clinic administrators.

The interface must feel closer to Apple, Linear, Stripe and modern SaaS
products than to Bootstrap or traditional enterprise software.
2. Design Philosophy

This is extremely important.

For example

Design Philosophy

Less UI
More content

Less decoration
More clarity

Comfort over density

Large typography

Generous whitespace

Soft shadows

Rounded corners

Subtle animations

Consistent spacing

Every screen should require almost no learning.
3. Visual Personality

Describe the product in words.

Example

Premium

Clean

Medical

Trustworthy

Friendly

Warm

Modern

Lightweight

Elegant

Not playful

Not corporate

Not futuristic
4. Target Users

This changes many UI decisions.

Example

Primary users

Patients

Doctors

Clinic administrators

Receptionists

Clinic owners

Then

Age

18–75

Important point

Many users are over 45.

Typography and spacing must prioritize readability over compactness.

That explains why we chose larger fonts.

5. Visual Inspiration

This is something we should have done weeks ago 😊

For example

Inspired by

Apple

Linear

Stripe Dashboard

Notion

Oxford Medical

Calendly

Google Calendar

NOT copied.

Only inspired.

6. UI Principles

For example

Every page answers:

Where am I?

What can I do?

What should I do next?

Never confuse users.

7. Product Rules

Example

One primary action.

Few secondary actions.

Never more than one dangerous action.

Danger is always red.

Success always green.

Warning always orange.

Information always blue.

Primary actions always teal.
8. Page Hierarchy

Every page follows

Clinic Header

↓

Page Header

↓

Content

↓

Actions

↓

Footer

Predictability.

9. Typography Philosophy

Instead of listing sizes (that belongs in another document), describe the goal:

Typography is designed for readability.

Avoid tiny fonts.

Avoid compressed layouts.

Headings should be immediately recognizable.

Important numbers should stand out.

Body text should never require zooming.
10. White Space

Very important.

Whitespace is part of the design.

Do not fill empty space unnecessarily.

Comfortable spacing increases readability.

Components breathe.

Margins remain consistent.
11. Motion
Animations should support the user.

Never distract.

Hover

150–200ms

Cards

Lift slightly

Buttons

Subtle feedback

Loading

Skeletons

Transitions

Smooth
12. Icons
Lucide

Consistent size

Meaningful

Never decorative

Always support text

Never replace labels
13. Error Philosophy
Errors help users.

Never blame users.

Explain

Show solution

Offer recovery

Never display raw errors.
14. Empty States

Example

No appointments

↓

Explain

↓

Illustration/Icon

↓

Primary CTA
15. Future
This UI Guide applies to

Clinic

Dentist

Beauty

Spa

Massage

Salon

Veterinarian

Any appointment-based business
16. Final Rule ⭐

This should be the last section.

If a UI decision is not covered by another document,
this UI Guide is the source of truth.

Every future component, page and feature must follow these principles.

Consistency is more important than novelty.



02_COLOR_SYSTEM.md

This will define all colors used in the application.

It should include:

Brand colors
Semantic colors (Success, Warning, Error, Info)
Background colors
Sidebar colors
Dark mode palette
Card colors
Table colors
Badge colors
Button colors
Hover/Focus/Disabled states
Charts and dashboard colors
Rules for adding new colors

After this file, nobody (including Roo) should invent colors anymore.

03_COMPONENT_LIBRARY.md

This will document every reusable component.

Example:

PageHeader
EmptyState
StatCard
AppointmentCard
DoctorCard
ClinicInfoCard
LanguageSwitcher
StatusBadge
PrimaryButton
SecondaryButton
DangerButton
Modal
Table
SearchBar

For each component we define:

Purpose
When to use it
When not to use it
Props
Variants
Examples
04_LAYOUT_RULES.md

This defines page structure.

For example:

Dashboard
Booking
Appointment List
Doctor Profile
Settings
Admin pages

Every page should follow a consistent layout.

05_BOOKING_UI.md

This becomes the complete specification for your booking system.

Everything you've been adjusting over the last few days goes here:

Clinic header
Progress wizard
Doctor cards
Date cards
Time slots
Patient form
Confirmation page
Mobile behavior
Colors
Animations

Once this exists, Roo should never redesign the booking flow unless you explicitly ask.

06_MOBILE_RULES.md

Rules like:

Minimum touch target size
Responsive breakpoints
Sidebar behavior
Tables → cards
Language selector placement
Font scaling
07_ACCESSIBILITY.md

Define:

Contrast requirements
Keyboard navigation
Focus styles
Screen-reader considerations
Error messages
Required font sizes
08_ROO_FRONTEND_RULES.md

This is where all of your accumulated experience goes.

For example:

Never replace existing routes.
Never create duplicate components.
Reuse Product UI Library first.
Reuse Theme tokens.
No hardcoded colors.
Support dark mode.
Support localization.
Mobile-first.
Preserve visual consistency.
No frontend-only sprint may modify backend or API.
Read the Design System before implementing any UI task.

This document will save you a huge amount of time in future sprints.

DESIGN_DECISIONS.md

This explains why decisions were made.

Examples:

Why teal?
Why rounded cards?
Why larger typography?
Why generous whitespace?
Why premium SaaS style?
Why mobile-first?

These explanations are invaluable months later when you're maintaining or extending the product.