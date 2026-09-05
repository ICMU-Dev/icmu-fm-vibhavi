# Graph Report - fm-vibhavi  (2026-09-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 608 nodes · 1291 edges · 25 communities
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `474e5c25`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- cn
- AdminDashboard.jsx
- ease.ts
- loader.jsx
- utils.ts
- dependencies
- popover.jsx
- wheel-picker.jsx
- devDependencies
- table/index.jsx
- day-row.jsx
- components.json
- context-menu.jsx
- center-morph-modal.jsx
- action-swap.jsx
- select.jsx
- expandable-tabs.jsx
- animated-toast-stack.jsx
- ease.js
- compilerOptions

## God Nodes (most connected - your core abstractions)
1. `cn()` - 153 edges
2. `EASE_OUT` - 22 edges
3. `Loader()` - 18 edges
4. `useComboboxContext()` - 12 edges
5. `Button` - 12 edges
6. `useStream()` - 11 edges
7. `Table()` - 10 edges
8. `useAnimatedSidebar()` - 9 edges
9. `getRoleLabel()` - 9 edges
10. `PopoverContent()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `AnimatedToastStack()` --calls--> `cn()`  [EXTRACTED]
  src/components/motion/animated-toast-stack.jsx → src/lib/utils.ts
- `ToastItem` --calls--> `cn()`  [EXTRACTED]
  src/components/motion/animated-toast-stack.jsx → src/lib/utils.ts
- `ContextMenu()` --calls--> `cn()`  [EXTRACTED]
  src/components/motion/context-menu.jsx → src/lib/utils.ts
- `ContextMenuLabel()` --calls--> `cn()`  [EXTRACTED]
  src/components/motion/context-menu.jsx → src/lib/utils.ts
- `ContextMenuRadioItem()` --calls--> `cn()`  [EXTRACTED]
  src/components/motion/context-menu.jsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (25 total, 0 thin omitted)

### Community 0 - "cn"
Cohesion: 0.05
Nodes (61): AnimatedSidebar, AnimatedSidebarClose, AnimatedSidebarContent, AnimatedSidebarContext, AnimatedSidebarFooter, AnimatedSidebarGroup, AnimatedSidebarGroupContent, AnimatedSidebarGroupLabel (+53 more)

### Community 1 - "AdminDashboard.jsx"
Cohesion: 0.06
Nodes (49): AdminLiveChatWidget(), calculateMessageLifetime(), formatCountdown(), isSafeUrl(), AdminRouteGuard(), ActiveAdmins(), ProfileCard(), Logo() (+41 more)

### Community 2 - "ease.ts"
Cohesion: 0.07
Nodes (40): BroadcastButton(), IconButton(), Button, ButtonLink, SIZE_CLASS, VARIANT_CLASS, MagneticButton, CHROME_SHIMMER (+32 more)

### Community 3 - "loader.jsx"
Cohesion: 0.06
Nodes (42): AdminRouteGuard, App(), NotFoundPage, ErrorBoundary, Ascii(), ASCII_SETS, Bars(), BAYER_4 (+34 more)

### Community 4 - "utils.ts"
Cohesion: 0.10
Nodes (33): COMBOBOX_MORPH, ComboboxContent(), Combobox(), ComboboxContext, ComboboxGroupContext, mergeRefs(), useComboboxContext(), ComboboxEmpty() (+25 more)

### Community 5 - "dependencies"
Cohesion: 0.05
Nodes (41): class-variance-authority, clsx, lucide-react, motion, dependencies, class-variance-authority, clsx, lucide-react (+33 more)

### Community 6 - "popover.jsx"
Cohesion: 0.10
Nodes (34): NotificationCardContent(), NotificationStack(), useControllableExpanded(), ALIGN_ORIGIN, buildGeo(), clipForProgress(), GOO_CLOSE_SPRING, GOO_OPEN_SPRING (+26 more)

### Community 7 - "wheel-picker.jsx"
Cohesion: 0.14
Nodes (23): RangeSlider(), SPRING_BOUNCY, useColumnReorder(), useColumnResize(), clamp(), easeOutBack(), optionLabel(), optionValue() (+15 more)

### Community 8 - "devDependencies"
Cohesion: 0.08
Nodes (24): eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies, eslint, @eslint/js (+16 more)

### Community 9 - "table/index.jsx"
Cohesion: 0.16
Nodes (17): EditableCell(), resolveColumnWidth(), Table(), useRootFontSize(), RowHandle(), SkeletonRows(), TableHeader(), TableMenu() (+9 more)

### Community 10 - "day-row.jsx"
Cohesion: 0.25
Nodes (17): CopyMenu(), DayRow(), AvailabilityScheduler(), buildOptions(), clampRange(), defaultWeek(), endOptions(), label12() (+9 more)

### Community 11 - "components.json"
Cohesion: 0.10
Nodes (19): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+11 more)

### Community 12 - "context-menu.jsx"
Cohesion: 0.15
Nodes (17): assignRef(), clamp(), collapsedClip(), ContextMenu(), ContextMenuCheckboxItem(), ContextMenuContent(), ContextMenuContext, ContextMenuItemBase() (+9 more)

### Community 13 - "center-morph-modal.jsx"
Cohesion: 0.18
Nodes (13): CENTER_UNFOLD_EASE, CENTER_UNFOLD_TRANSITION, CenterMorphModal(), CenterMorphModalClose(), CenterMorphModalContent(), CenterMorphModalContext, CenterMorphModalTrigger(), FOCUSABLE_SELECTOR (+5 more)

### Community 14 - "action-swap.jsx"
Cohesion: 0.16
Nodes (10): ActionSwap(), ActionSwapIcon(), ActionSwapText(), BLUR_TRANSITION, CASCADE_LETTER_VARIANTS, ICON_VARIANTS, ROLL_EXIT_TRANSITION, SIZE_CLASS (+2 more)

### Community 15 - "select.jsx"
Cohesion: 0.24
Nodes (12): TimeSelect(), CHEVRON_TRANSITION, INSTANT_TRANSITION, ITEM_VARIANTS, LIST_VARIANTS, Select(), SelectContent(), SelectContext (+4 more)

### Community 16 - "expandable-tabs.jsx"
Cohesion: 0.21
Nodes (12): CONTENT_SPRING, CONTENT_VARIANTS, ExpandableTabs(), LABEL_CLOSE, LABEL_OPEN, REDUCED_CONTENT_VARIANTS, sameSize(), sameWidths() (+4 more)

### Community 17 - "animated-toast-stack.jsx"
Cohesion: 0.22
Nodes (9): AnimatedToastStack(), CONTENT_TRANSITION, createToast(), POSITION_CLASS, STACK_SPRING, STATUS_CLASS, STATUS_ICON, ToastItem (+1 more)

### Community 18 - "ease.js"
Cohesion: 0.20
Nodes (9): EASE_DRAWER, EASE_IN_OUT, EASE_OUT, SPRING_GLIDE, SPRING_LAYOUT, SPRING_MOUSE, SPRING_PANEL, SPRING_PRESS (+1 more)

### Community 19 - "compilerOptions"
Cohesion: 0.50
Nodes (3): compilerOptions, baseUrl, paths

## Knowledge Gaps
- **168 isolated node(s):** `AnimatedSidebarContext`, `AnimatedSidebarPanelContext`, `FOCUSABLE_SELECTOR`, `LABEL_ENTER_TRANSITION`, `LABEL_EXIT_TRANSITION` (+163 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 195 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `AdminDashboard.jsx`, `ease.ts`, `loader.jsx`, `utils.ts`, `popover.jsx`, `wheel-picker.jsx`, `table/index.jsx`, `day-row.jsx`, `context-menu.jsx`, `center-morph-modal.jsx`, `action-swap.jsx`, `select.jsx`, `expandable-tabs.jsx`, `animated-toast-stack.jsx`?**
  _High betweenness centrality (0.404) - this node is a cross-community bridge._
- **Why does `Loader()` connect `loader.jsx` to `cn`, `AdminDashboard.jsx`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `EASE_OUT` connect `ease.ts` to `cn`, `AdminDashboard.jsx`, `utils.ts`, `popover.jsx`, `context-menu.jsx`, `center-morph-modal.jsx`, `action-swap.jsx`, `select.jsx`, `expandable-tabs.jsx`, `animated-toast-stack.jsx`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `Loader()` (e.g. with `Ascii()` and `Bars()`) actually correct?**
  _`Loader()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `AnimatedSidebarContext`, `AnimatedSidebarPanelContext`, `FOCUSABLE_SELECTOR` to the rest of the system?**
  _168 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.0525879917184265 - nodes in this community are weakly interconnected._
- **Should `AdminDashboard.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.057971014492753624 - nodes in this community are weakly interconnected._