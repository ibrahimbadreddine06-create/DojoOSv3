# Dojo OS Design Guidelines

## Design Approach

**Selected Approach**: Design System + Reference-Based Hybrid

**Primary References**:
- Linear (typography, spacing, modern productivity aesthetics)
- Notion (information hierarchy, nested content, multi-view layouts)
- Material Design (structural foundation, component behavior)

**Core Principles**:
1. Information Clarity: Dense data must remain scannable and hierarchical
2. Consistent Mental Models: Similar patterns across all modules despite unique behaviors
3. Efficient Navigation: Quick access to any module/subpage with minimal clicks
4. Progressive Disclosure: Show essentials first, details on demand

---

## Typography System

**Font Stack**:
- Primary: Inter (via Google Fonts CDN)
- Monospace: JetBrains Mono (for metrics, numbers, timestamps)

**Hierarchy**:
- Page Titles: text-3xl font-semibold tracking-tight
- Section Headers: text-xl font-semibold
- Subsection Headers: text-lg font-medium
- Body Text: text-base font-normal
- Captions/Meta: text-sm text-gray-600
- Micro-labels: text-xs font-medium uppercase tracking-wide
- Numeric Data: Monospace, text-lg font-medium

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16, 24** for consistency
- Component padding: p-4 to p-6
- Section spacing: space-y-8 to space-y-12
- Page margins: p-8 to p-12
- Card gaps: gap-6

**Grid Structure**:
- Main Layout: Sidebar (280px fixed) + Content Area (flex-1)
- Content max-width: max-w-7xl mx-auto
- Dense data sections: Use 12-column grid for flexible layouts
- Card grids: 2-4 columns depending on content density

**Responsive Breakpoints**:
- Mobile: Single column, collapsible sidebar
- Tablet: 2-column where appropriate
- Desktop: Full multi-column layouts

---

## Navigation Architecture

**Top-Level Navigation**:
- Fixed left sidebar (280px) with two main sections clearly separated:
  - **Dojo** (expandable tree): All active workspace modules
  - **Ultimate Test**: Single entry point
- Sidebar sections collapsible with smooth transitions
- Active page highlighted with subtle background fill
- Nested pages indented with connecting lines

**Module Navigation**:
- Breadcrumb trail at top: Home > Dojo > Body > Workout
- Sub-navigation tabs for modules with subpages (e.g., Body's four subpages)
- Quick switcher: CMD/CTRL+K for fuzzy search across all pages

**Navigation Components**:
- Sidebar items: Hover state with subtle background, icon + label layout
- Active state: Left border accent + background tint
- Nested items: 16px indent per level with vertical connector lines

---

## Core Component Library

**Cards**:
- Base: Rounded corners (rounded-lg), subtle border, white background
- Shadow: Minimal (shadow-sm on hover: shadow-md)
- Padding: p-6 standard
- Variants: Outlined (border only), Filled (subtle background), Elevated (shadow)

**Buttons**:
- Primary: Solid background, medium weight text, rounded-md, px-4 py-2
- Secondary: Outlined with border
- Tertiary: Ghost (no border/background, hover state only)
- Icon Buttons: Square (40x40), centered icon, subtle hover
- Button Groups: Connected with shared borders

**Forms & Inputs**:
- Text inputs: Minimal border (border-gray-300), focus ring, rounded-md, px-3 py-2
- Select dropdowns: Custom styled to match inputs
- Checkboxes: Rounded-sm (4px), accent color fill when checked
- Time pickers: Custom component mimicking Google Calendar's time selection
- Multi-select tags: Pill-shaped (rounded-full) with remove icons

**Data Display**:
- Tables: Minimal borders, alternating row backgrounds, sticky headers
- List items: Clean separation with subtle dividers, hover states
- Metrics cards: Large number (monospace), small label, optional trend indicator
- Progress bars: Thin (h-2), rounded-full, smooth transitions
- Status badges: Pill-shaped, size-appropriate text, semantic colors for states

**Modals & Overlays**:
- Modal: Centered, max-w-2xl, backdrop blur, rounded-lg, shadow-xl
- Dropdown menus: Minimal shadow, rounded-md, py-1 padding
- Popovers: Small arrow indicator, rounded-lg, shadow-lg
- Slide-over panels: Full-height, 480px width, from right edge

**Charts & Visualizations**:
- Use Chart.js or Recharts via CDN
- Line charts: Clean grid, subtle axis lines, single accent color for main data
- Multi-series: Limited color palette (3-4 colors max)
- Interactive tooltips: Show precise values on hover
- Time-series: X-axis shows dates clearly, Y-axis auto-scales

---

## Module-Specific Patterns

**Planner/Calendar View**:
- Single-day view: 24-hour timeline with hourly divisions
- Time blocks: Card-style with handles for dragging/resizing
- Block associations: Small badges showing linked pages (icons + abbreviated labels)
- Importance levels: Visual indicator (1-5 dots or bar)
- Date navigator: Previous/Today/Next buttons + date picker dropdown

**Goals Hierarchy**:
- Tree structure: Indented hierarchy with expand/collapse controls
- Visual nesting: Left border accent increases thickness per depth level
- Progress indicators: Inline progress bars (derived from subgoals)
- Priority levels: Icon-based (!, !!, !!!) or colored dots
- Year/Quarter/Month filters: Chip-based filter bar above goal list

**Knowledge Trackers (Second Brain, Languages, Disciplines)**:
- Dual-metric cards: COMPLETION and READINESS shown side-by-side
- Per-theme cards: Compact design with mini line chart preview
- Learn-plan checklist: Clean checkbox list, grouped by completion status
- Materials section: Grid of cards (flashcard decks, docs, links) with type icons

**Body Tracking**:
- Four-tab layout for subpages (Workout, Intake, Sleep, Hygiene)
- Workout log: Exercise table with sets/reps/weight columns, inline editing
- Intake tracker: Daily total summary card + meal-by-meal breakdown
- Charts: Small multiples for tracking trends over time

**Time Block Associations**:
- Linked blocks section: Appears on relevant pages as a collapsible panel
- Block preview: Shows time, tasks, completion status
- Edit in place: Clicking opens inline editor without navigation
- Sync indicator: Subtle icon showing it's linked to planner

**Possessions/Outfits**:
- Grid layout for clothing items with thumbnail images
- Outfit picker: Multi-select mode with preview pane
- Laundry status: Color-coded badges (green=clean, yellow=second-wear, red=dirty)
- Usage stats: Simple bar charts showing most-worn items

---

## State & Interaction Patterns

**Loading States**:
- Skeleton screens for initial page loads (matching content structure)
- Inline spinners for actions (saving, loading data)
- Optimistic updates: Show changes immediately, revert on error

**Empty States**:
- Centered message with icon
- Clear CTA button to add first item
- Brief explanation of what goes in that section

**Completion/Check-off**:
- Checkboxes: Smooth animation on check
- Completed items: Slight opacity reduction, optional strikethrough
- Undo option: Toast notification with undo button (3-second timeout)

**Editing Modes**:
- Inline editing: Double-click to edit, click outside to save
- Modal editing: For complex forms (goal creation, preset management)
- Auto-save: For continuous input (notes, descriptions)

---

## Iconography

**Icon Library**: Heroicons (via CDN)
- Navigation icons: 20px outlined style
- Action icons: 16px outlined style
- Status indicators: 12px solid style
- Consistent usage: Each entity type has dedicated icon (calendar, book, dumbbell, etc.)

---

## Accessibility & Consistency

- All interactive elements: min 44px touch target
- Focus indicators: Visible ring on all focusable elements
- Keyboard navigation: Full support, logical tab order
- ARIA labels: Descriptive labels for screen readers
- Form validation: Inline error messages below inputs
- Consistent spacing: Same patterns across all modules for predictability

---

## Performance Considerations

- Virtualized lists for long data sets (goals, transactions)
- Lazy load charts: Only render when section is visible
- Debounced search/filter inputs
- Cached preset/template data
- Minimal animations: Only meaningful transitions (page changes, state updates)