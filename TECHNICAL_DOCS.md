# Compandio Wiki - Technical Documentation

> **For New Engineers:** This document provides a comprehensive overview of the system architecture, data models, and key code areas. Use it to onboard quickly and find opportunities for improvement.

## Table of Contents

1. [System Architecture Overview](#1-system-architecture-overview)
2. [Data Model & Database](#2-data-model--database)
3. [Component Architecture](#3-component-architecture)
4. [Navigation System](#4-navigation-system)
5. [Document Editor](#5-document-editor)
6. [Content Rendering Pipeline](#6-content-rendering-pipeline)
7. [Search & Filtering](#7-search--filtering)
8. [Authentication & Security](#8-authentication--security)
9. [Styling & Theming](#9-styling--theming)
10. [Key Utilities & Libraries](#10-key-utilities--libraries)
11. [Common Patterns & Conventions](#11-common-patterns--conventions)
12. [Known Technical Decisions & Trade-offs](#12-known-technical-decisions--trade-offs)
13. [Areas for Potential Refactoring](#13-areas-for-potential-refactoring)
14. [Quick Reference: File Locations](#14-quick-reference-file-locations)
15. [Getting Started for New Engineers](#15-getting-started-for-new-engineers)

---

## 1. System Architecture Overview

### Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| State Management | React Context + TanStack Query |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Rich Text Editor | BlockNote |
| Markdown Processing | marked + DOMPurify |

### Application Entry Points

**`src/main.tsx`** - React DOM render entry  
**`src/App.tsx`** - Provider hierarchy and routing

```
QueryClientProvider
  └─ ThemeProvider
       └─ AuthProvider
            └─ TooltipProvider
                 └─ BrowserRouter
                      └─ Routes
                           ├─ /auth → Auth page
                           └─ /* → ProtectedRoute → PersistentLayout
```

### Core Architectural Patterns

1. **Centralized Navigation State** (`useNavigationState` hook)
   - Single source of truth for document path and section selection
   - Uses refs alongside state to prevent stale closures
   - Provides atomic updates to prevent race conditions

2. **Layout Context Pattern** (`PersistentLayout` component)
   - Provides shared UI state to all child components
   - Manages: editor visibility, filter panel, navigation structure, expand/collapse states

3. **Service Layer Pattern**
   - `ContentService` - CRUD operations for documents
   - `SearchService` - Full-text search across documents

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  content_items  │  │   Auth.users    │  │    RLS Rules    │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────┘ │
└───────────┼────────────────────┼────────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────┐  ┌─────────────────────┐
│   ContentService    │  │     useAuth         │
│   SearchService     │  │   (Auth Hook)       │
└──────────┬──────────┘  └──────────┬──────────┘
           │                        │
           ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    useNavigationState                           │
│              (Centralized Navigation Hook)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PersistentLayout                            │
│                    (Layout Context)                             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│ HybridNavigation│  │ ContentPage │  │ SearchOverlay   │
│    Sidebar      │  │             │  │                 │
└─────────────────┘  └──────┬──────┘  └─────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐
│ FolderLanding   │  │Hierarchical │  │ BlockNoteSection│
│     Page        │  │ContentDisplay│ │    Editor       │
└─────────────────┘  └─────────────┘  └─────────────────┘
```

---

## 2. Data Model & Database

### Single Table Design

All content is stored in one table: `content_items`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (auto-generated) |
| `title` | text | Display name |
| `path` | text | URL-friendly path (e.g., `/getting-started`) |
| `parent_id` | uuid (nullable) | Reference to parent item for hierarchy |
| `order_index` | integer | Sort order among siblings (default: 0) |
| `content_json` | jsonb | Array of `DocumentSection` objects |
| `tags` | text[] | Array of tag strings (default: `{}`) |
| `created_at` | timestamptz | Auto-set on insert |
| `updated_at` | timestamptz | Auto-updated via trigger |

### Document Section Structure

```typescript
interface DocumentSection {
  id: string;           // Unique section ID (e.g., "section-1")
  title: string;        // Section heading text
  level: number;        // Hierarchy depth (1-99 supported)
  content: string;      // Markdown content
  tags: string[];       // Section-level tags
  sources?: string[];   // Optional source URLs
}
```

### Hierarchy Model

```
content_items (Folders & Documents)
├── Folders: content_json = null
└── Documents: content_json = DocumentSection[]

Parent-Child via parent_id column
Section hierarchy: FLAT array with `level` property
```

**Key distinctions:**
- **Folders** have `content_json = null`
- **Documents** have `content_json` containing sections array
- Parent-child relationships via `parent_id` column
- Section hierarchy is FLAT in storage but has `level` property for reconstruction

### Row-Level Security (RLS)

Currently configured for authenticated user access:

| Policy | Command | Expression |
|--------|---------|------------|
| Read | SELECT | `true` (all authenticated) |
| Insert | INSERT | `true` (all authenticated) |
| Update | UPDATE | `true` (all authenticated) |
| Delete | DELETE | `true` (all authenticated) |

**Note:** All policies are `TO authenticated`, meaning unauthenticated users have no access.

---

## 3. Component Architecture

### Component Tree Overview

```
App
└─ PersistentLayout (context provider)
    └─ WikiLayout (responsive layout)
        ├─ HybridNavigationSidebar
        │   ├─ Logo & Sign Out
        │   ├─ Search Button → SearchOverlay
        │   └─ EnhancedSectionItem (recursive tree)
        └─ ContentPage
            ├─ PageBreadcrumb
            ├─ SimpleFilterPanel (modal)
            ├─ FolderLandingPage (if folder)
            ├─ HierarchicalContentDisplay (if document)
            └─ BlockNoteSectionEditor (if editing)
```

### Key Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `PersistentLayout` | `src/components/` | Global state provider, initial data loading, layout context |
| `WikiLayout` | `src/components/` | Responsive two-pane layout with resizable sidebar |
| `HybridNavigationSidebar` | `src/components/` | Sidebar tree navigation with folders and sections |
| `EnhancedSectionItem` | `src/components/` | Recursive tree item with expand/collapse |
| `ContentPage` | `src/pages/` | Main content orchestration, document/folder switching |
| `HierarchicalContentDisplay` | `src/components/` | Renders document sections with expand/collapse, rubrics |
| `BlockNoteSectionEditor` | `src/components/editor/` | Full-screen document editing modal |
| `SearchOverlay` | `src/components/` | Global search with keyboard navigation |
| `SimpleFilterPanel` | `src/components/` | Filter content by term and tags |
| `PageBreadcrumb` | `src/components/` | Navigation breadcrumb trail |

### Component Communication

1. **Props drilling** - For immediate parent-child relationships
2. **Layout Context** - Cross-cutting UI state (`useLayoutContext`)
3. **Navigation hook** - URL-based state (`useNavigationState`)
4. **Callbacks** - Child-to-parent events (e.g., `onSectionSelect`, `onStructureUpdate`)

---

## 4. Navigation System

### State Management

**File: `src/hooks/useNavigationState.ts`**

```typescript
interface NavigationState {
  documentPath: string;      // Current document path
  sectionId: string | null;  // Currently viewed section
  sectionTitle: string | null;
  sectionView: SectionViewData | null;
}
```

Key features:
- Uses refs alongside state to prevent stale closures
- Provides atomic updates to prevent race conditions
- Cleans URL hash after section navigation

### Navigation Flow

```
1. User Action (click sidebar/link)
           │
           ▼
2. navigate() from React Router
           │
           ▼
3. URL updates (path + optional hash)
           │
           ▼
4. ContentPage detects via useLocation()
           │
           ▼
5. ContentService.getDocumentByPath()
           │
           ▼
6. Render content or scroll to section
```

### Hash-based Section Navigation

- Section IDs appear in URL hash: `/doc-path#section-5`
- On initial load, hash is parsed and section scrolled into view
- Hash is cleaned from URL after navigation to prevent stale state

### Internal Links

**Syntax variations:**
- `[[Section Title]]` - Links to section by title
- `[[display text|/path#section]]` - Links with custom display text

**Resolution flow:**
1. `markdownRenderer.ts` converts wiki syntax to `data-internal-link` attributes
2. Click handler in `HierarchicalContentDisplay` catches link clicks
3. `internalLinkResolver.ts` matches target to section ID across all documents
4. Navigation action dispatched to navigate and highlight section

---

## 5. Document Editor

### Editor Architecture

**File: `src/components/editor/BlockNoteSectionEditor.tsx`**

The editor is a full-screen modal supporting two modes:

| Mode | Description |
|------|-------------|
| **Visual (WYSIWYG)** | BlockNote rich text editor |
| **Markdown** | Plain textarea with formatting toolbar |

### Data Conversion Pipeline

```
DocumentSection[] ─── flatSectionsToBlocks() ───> BlockNote Blocks
                                                        │
                                                    (editing)
                                                        │
BlockNote Blocks ─── blocksToFlatSections() ───> DocumentSection[]
```

**Key file: `src/lib/blockNoteConversions.ts`**

Functions:
- `flatSectionsToBlocks()` - Converts flat sections to nested block structure
- `blocksToFlatSections()` - Converts blocks back to flat sections
- `validateRoundTrip()` - Verifies conversion integrity

### Level Preservation

BlockNote only supports heading levels 1-3 visually, but the system supports levels 1-99:

- `originalLevel` property stored in block props
- Visual rendering clamps display to level 3
- CSS provides indentation for deeper levels
- Round-trip conversion preserves actual levels

### Auto-Save Behavior

- **Debounce:** 2-second delay after content changes
- **Silent:** No UI indicator during save
- **Mode switch:** Triggers immediate save before transition
- **Explicit:** "Save & Close" button for manual save and exit

### Editor Features

- Markdown formatting toolbar (Bold, Italic, Link, List)
- Internal link picker with document/section search
- Find/Replace (Ctrl+F in markdown mode)
- Markup guide sidebar with syntax reference
- Full-screen modal with semi-transparent backdrop

---

## 6. Content Rendering Pipeline

### Markdown Processing

**File: `src/lib/markdownRenderer.ts`**

```
Raw Markdown Content
         │
         ▼
┌─────────────────────────┐
│  preprocessWikiLinks()  │  Converts [[links]] to markdown
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│     marked.parse()      │  Markdown → HTML
└────────────┬────────────┘
             ▼
┌─────────────────────────┐
│  DOMPurify.sanitize()   │  XSS protection
└────────────┬────────────┘
             ▼
      Safe HTML Output
```

### Hierarchical Display

**File: `src/components/HierarchicalContentDisplay.tsx`**

Features:
- Recursive section rendering with depth-based styling
- Expand/collapse with chevron controls
- Manual override tracking for expand states
- Rubric grouping (color-coded category labels)
- Description visibility toggles
- Context menu for "Open in new tab"
- Internal link click handling

### Rubric System

**File: `src/lib/rubricConfig.ts`**

Sections with titles like "Background: Topic Name" are grouped by rubric:

```typescript
const rubricOrder = [
  'Background',
  'Summary', 
  // ... configurable order
];
```

- Color treatments defined per rubric type
- Display order configurable via array
- Extracted from level 2+ section titles only
- Items without rubrics appear last

---

## 7. Search & Filtering

### Global Search

**File: `src/services/searchService.ts`**

Search capabilities:
- Searches document titles, section titles, and content
- Relevance scoring with proximity weighting
- Deduplication of results
- Breadcrumb path display for context

```typescript
interface SearchResult {
  documentId: string;
  documentTitle: string;
  documentPath: string;
  sectionId?: string;
  sectionTitle?: string;
  matchedText: string;
  fullContent: string;
  breadcrumbPath: string;
  matchType: 'title' | 'section_title' | 'content';
  relevanceScore: number;
}
```

**File: `src/components/SearchOverlay.tsx`**

- Triggered by search button in sidebar header
- Keyboard navigation (↑↓ arrows, Enter, Escape)
- 200ms debounced search
- Minimum 2 characters to trigger search

### Content Filtering

**File: `src/components/SimpleFilterPanel.tsx`**

- Filter by search term within document
- Filter by section tags
- Modal overlay interface
- Used within document view for section filtering

---

## 8. Authentication & Security

### Auth Flow

**File: `src/hooks/useAuth.tsx`**

```typescript
interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  loading: boolean;
}
```

Features:
- Supabase Auth with email/password
- Session persistence via `onAuthStateChange` listener
- Protected routes via `ProtectedRoute` component
- Automatic redirect to `/auth` when unauthenticated

### Security Measures

| Measure | Implementation |
|---------|----------------|
| RLS | Enabled on `content_items`, authenticated users only |
| Sign-up | Disabled in UI (registration closed message) |
| XSS | DOMPurify sanitization of all rendered markdown |
| SQL Injection | Supabase parameterized queries |
| Crawl Prevention | robots.txt disallow, noindex meta tags |

### Security Limitations

- All authenticated users have full access to all content
- No per-user content ownership (collaborative model)
- Sign-up must also be disabled in Supabase Dashboard for full protection
- No role-based access control

---

## 9. Styling & Theming

### Theme System

**File: `src/hooks/use-theme.tsx`**

- Light/dark mode support
- Persisted to localStorage (`wiki-ui-theme` key)
- CSS variables for dynamic theming
- System preference detection

### Tailwind Configuration

**File: `tailwind.config.ts`**

Custom semantic colors:
```typescript
colors: {
  'hierarchy-hover': 'hsl(var(--hierarchy-hover))',
  'hierarchy-line': 'hsl(var(--hierarchy-line))',
  'content-level-1': 'hsl(var(--content-level-1))',
  'content-level-2': 'hsl(var(--content-level-2))',
  // ... through level 6
}
```

### CSS Variables

**File: `src/index.css`**

Defines HSL color values for:
- Background and foreground
- Primary, secondary, accent colors
- Muted and destructive states
- Hierarchy and content level colors

### Component Library

Uses shadcn/ui components in `src/components/ui/`:
- Pre-styled, accessible components
- Radix UI primitives under the hood
- Consistent design language
- Easy customization via CSS variables

---

## 10. Key Utilities & Libraries

| File | Purpose |
|------|---------|
| `src/lib/blockNoteConversions.ts` | Section ↔ BlockNote block conversion |
| `src/lib/hierarchyParser.ts` | Markdown ↔ section parsing (editor only) |
| `src/lib/markdownRenderer.ts` | Markdown → HTML with wiki links |
| `src/lib/internalLinkResolver.ts` | Resolve `[[links]]` to section IDs |
| `src/lib/sectionContentExtractor.ts` | Extract section content for isolated view |
| `src/lib/sectionHierarchy.ts` | Build hierarchical section trees |
| `src/lib/rubricConfig.ts` | Rubric colors and display ordering |
| `src/lib/tagManager.ts` | Tag extraction and management |
| `src/lib/sectionUtils.ts` | Section helper utilities |
| `src/lib/utils.ts` | General utilities (cn, etc.) |

---

## 11. Common Patterns & Conventions

### State Management Patterns

1. **Refs for latest state** - Prevents stale closures in callbacks
   ```typescript
   const stateRef = useRef(state);
   useEffect(() => { stateRef.current = state; }, [state]);
   ```

2. **Memoized callbacks** - `useCallback` for stable references passed to children

3. **Effect cleanup** - Always unsubscribe listeners and cancel pending operations

### Error Handling

- Console warnings for non-critical errors
- Graceful fallbacks (empty arrays, null checks)
- User-facing toasts for actionable errors via Sonner
- Try-catch blocks around async operations

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HierarchicalContentDisplay` |
| Hooks | camelCase with `use` prefix | `useNavigationState` |
| Services | PascalCase with `Service` suffix | `ContentService` |
| Utilities | camelCase functions | `flatSectionsToBlocks` |
| Files | Match export name | `useNavigationState.ts` |

### File Organization

```
src/
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── editor/       # Editor-related components
│   └── *.tsx         # Feature components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── pages/            # Route components
├── services/         # Data access layer
└── integrations/     # External service clients
```

---

## 12. Known Technical Decisions & Trade-offs

### Flat Section Storage

**Decision:** Store sections as flat array with `level` property instead of nested objects.

**Rationale:** 
- Simpler database queries
- Easier reordering operations
- Straightforward conversion to/from markdown

**Trade-off:** Requires reconstruction of hierarchy for display.

### Single Content Table

**Decision:** One `content_items` table for both folders and documents.

**Rationale:**
- Simplified queries
- Unified hierarchy
- Easy parent-child relationships

**Trade-off:** Folders have null `content_json`, requiring type checking.

### BlockNote Level Clamping

**Decision:** Clamp visual heading levels to 3 while preserving actual levels in data.

**Rationale:** 
- BlockNote library limitation
- Supports arbitrary depth without editor modification

**Trade-off:** Deep sections look similar visually; relies on CSS indentation.

### Auto-Save Without Indicator

**Decision:** Silent auto-save with no UI feedback.

**Rationale:**
- Reduces UI clutter
- Save & Close provides explicit control

**Trade-off:** Users may not know when save completes.

### Collaborative Access Model

**Decision:** All authenticated users have equal access to all content.

**Rationale:**
- Simpler RLS policies
- Wiki-style collaborative editing

**Trade-off:** No per-user content ownership or permissions.

---

## 13. Areas for Potential Refactoring

### High Priority

1. **Content type discrimination**
   - Add explicit `type` column (`folder` | `document`) to `content_items`
   - Currently checking `content_json` nullability
   - Would simplify queries and type safety

2. **Search optimization**
   - Current implementation makes two separate queries
   - Could use database functions or full-text search indexes
   - Consider PostgreSQL `tsvector` for better performance

3. **Component size**
   - `HierarchicalContentDisplay.tsx` is 770+ lines
   - Split into sub-components: `SectionItem`, `RubricGroup`, `ExpandControls`

### Medium Priority

4. **Error boundaries**
   - Add React error boundaries around major sections
   - Prevent entire app crash from component errors

5. **Loading states**
   - More granular loading indicators
   - Skeleton components for better perceived performance

6. **Test coverage**
   - Unit tests for conversion utilities
   - Integration tests for services
   - Component tests for critical flows

### Future Enhancements

7. **Multi-user support**
   - Add `created_by`, `updated_by` columns
   - Per-user RLS policies
   - Content ownership tracking

8. **Version history**
   - Track document changes over time
   - Diff viewing and rollback capability

9. **Real-time collaboration**
   - Leverage Supabase Realtime
   - Concurrent editing indicators

10. **Image uploads**
    - Add Supabase Storage bucket
    - Image embedding in content

---

## 14. Quick Reference: File Locations

| Concern | Primary Files |
|---------|--------------|
| Routing | `src/App.tsx` |
| Global State | `src/components/PersistentLayout.tsx` |
| Navigation Logic | `src/hooks/useNavigationState.ts` |
| Data Access | `src/services/contentService.ts` |
| Search | `src/services/searchService.ts`, `src/components/SearchOverlay.tsx` |
| Document Editing | `src/components/editor/BlockNoteSectionEditor.tsx` |
| Content Display | `src/components/HierarchicalContentDisplay.tsx` |
| Markdown Rendering | `src/lib/markdownRenderer.ts` |
| Block Conversion | `src/lib/blockNoteConversions.ts` |
| Authentication | `src/hooks/useAuth.tsx`, `src/pages/Auth.tsx` |
| Types | `src/integrations/supabase/types.ts`, `src/services/contentService.ts` |
| Styling | `src/index.css`, `tailwind.config.ts` |

---

## 15. Getting Started for New Engineers

### Onboarding Checklist

- [ ] **Read the data model** - Understand `content_items` table and `DocumentSection` interface
- [ ] **Trace a navigation flow** - Click a sidebar item, follow the code path through components
- [ ] **Edit a document** - Open editor, make changes, observe the save flow
- [ ] **Search for something** - Understand search result structure and navigation
- [ ] **Add a console log** - Familiarize yourself with the component hierarchy
- [ ] **Review RLS policies** - Understand security boundaries

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

### Key Environment Variables

Located in `.env`:
- Supabase URL and keys (auto-configured)

### Debugging Tips

1. **React DevTools** - Inspect component tree and state
2. **Network tab** - Watch Supabase API calls
3. **Console** - Service layer logs errors here
4. **URL hash** - Check for stale section references

### Common Tasks

| Task | Where to Look |
|------|---------------|
| Add a new page | `src/pages/`, `src/App.tsx` routes |
| Modify sidebar | `src/components/HybridNavigationSidebar.tsx` |
| Change content display | `src/components/HierarchicalContentDisplay.tsx` |
| Add database column | Create Supabase migration |
| Modify search | `src/services/searchService.ts` |
| Change editor behavior | `src/components/editor/BlockNoteSectionEditor.tsx` |

---

*Last updated: January 2026*
