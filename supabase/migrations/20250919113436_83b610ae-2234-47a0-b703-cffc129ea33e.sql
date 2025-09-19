-- Create a comprehensive sample document with 6 levels of depth in the Deep Structures folder
-- First, add the navigation entry
INSERT INTO navigation_structure (
    id,
    title,
    path,
    type,
    parent_id,
    order_index,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'System Architecture Guide',
    '/deep-structures/system-architecture-guide',
    'document',
    'f30f9e4f-1891-4950-9ce0-21b881a83317',
    1,
    now(),
    now()
);

-- Create the detailed document with 6 levels of hierarchy
INSERT INTO documents (
    id,
    title,
    path,
    content_json,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'System Architecture Guide',
    '/deep-structures/system-architecture-guide',
    '{
        "sections": [
            {
                "id": "overview",
                "title": "System Overview",
                "content": "This comprehensive guide covers the complete system architecture from high-level concepts to detailed implementation specifics. It demonstrates the full capability of hierarchical documentation with 6 levels of depth.",
                "level": 1,
                "tags": ["overview", "architecture"]
            },
            {
                "id": "frontend-architecture",
                "title": "Frontend Architecture",
                "content": "The frontend layer handles user interactions and presentation logic, built with modern web technologies for optimal performance and user experience.",
                "level": 2,
                "tags": ["frontend", "ui"]
            },
            {
                "id": "component-structure",
                "title": "Component Structure",
                "content": "Our component architecture follows atomic design principles, ensuring reusability and maintainability across the entire application.",
                "level": 3,
                "tags": ["components", "atomic-design"]
            },
            {
                "id": "ui-components",
                "title": "UI Components",
                "content": "Base UI components provide the foundation for all user interface elements, implemented with accessibility and consistency in mind.",
                "level": 4,
                "tags": ["ui", "components", "accessibility"]
            },
            {
                "id": "button-system",
                "title": "Button System",
                "content": "The button system includes variants for different contexts: primary, secondary, ghost, outline, and destructive actions.",
                "level": 5,
                "tags": ["buttons", "variants"]
            },
            {
                "id": "button-states",
                "title": "Button States & Interactions",
                "content": "Each button supports multiple states: default, hover, active, focus, disabled, and loading. Interaction patterns follow accessibility guidelines with proper focus management and keyboard navigation.",
                "level": 6,
                "tags": ["states", "interactions", "a11y"]
            },
            {
                "id": "form-components",
                "title": "Form Components",
                "content": "Form components handle user input with validation, error states, and accessibility features built-in.",
                "level": 5,
                "tags": ["forms", "validation"]
            },
            {
                "id": "input-validation",
                "title": "Input Validation Patterns",
                "content": "Real-time validation provides immediate feedback while maintaining good UX. Validation rules are configurable and support both client-side and server-side validation.",
                "level": 6,
                "tags": ["validation", "patterns", "ux"]
            },
            {
                "id": "layout-components",
                "title": "Layout Components",
                "content": "Layout components provide consistent spacing, grid systems, and responsive behavior across all screen sizes.",
                "level": 4,
                "tags": ["layout", "responsive", "grid"]
            },
            {
                "id": "responsive-grid",
                "title": "Responsive Grid System",
                "content": "The grid system adapts to different screen sizes with breakpoints at 640px, 768px, 1024px, and 1280px.",
                "level": 5,
                "tags": ["grid", "breakpoints", "responsive"]
            },
            {
                "id": "mobile-optimizations",
                "title": "Mobile-First Optimizations",
                "content": "All components are designed mobile-first with progressive enhancement for larger screens. Touch targets meet accessibility guidelines with minimum 44px hit areas.",
                "level": 6,
                "tags": ["mobile", "touch", "progressive-enhancement"]
            },
            {
                "id": "data-layer",
                "title": "Data Layer Architecture",
                "content": "The data layer manages application state, API communications, and data persistence with efficient caching strategies.",
                "level": 2,
                "tags": ["data", "state", "api"]
            },
            {
                "id": "state-management",
                "title": "State Management",
                "content": "Application state is managed through a combination of React hooks, context providers, and external state libraries for complex scenarios.",
                "level": 3,
                "tags": ["state", "react", "hooks"]
            },
            {
                "id": "global-state",
                "title": "Global State Patterns",
                "content": "Global state is minimized and carefully managed through context providers and state reducers for predictable updates.",
                "level": 4,
                "tags": ["global-state", "context", "reducers"]
            },
            {
                "id": "user-session",
                "title": "User Session Management",
                "content": "User sessions are managed with secure token handling, automatic refresh, and proper cleanup on logout.",
                "level": 5,
                "tags": ["session", "security", "tokens"]
            },
            {
                "id": "token-refresh",
                "title": "Automatic Token Refresh Strategy",
                "content": "Tokens are automatically refreshed before expiration using a background service. Failed refreshes trigger secure logout flows to protect user data.",
                "level": 6,
                "tags": ["tokens", "refresh", "security", "background-service"]
            },
            {
                "id": "api-integration",
                "title": "API Integration Layer",
                "content": "RESTful APIs are integrated through a standardized service layer with error handling, retry logic, and request/response transformation.",
                "level": 3,
                "tags": ["api", "rest", "services"]
            },
            {
                "id": "http-client",
                "title": "HTTP Client Configuration",
                "content": "The HTTP client includes automatic retry policies, request/response interceptors, and standardized error handling across all API calls.",
                "level": 4,
                "tags": ["http", "client", "interceptors"]
            },
            {
                "id": "retry-policies",
                "title": "Retry & Circuit Breaker Patterns",
                "content": "Exponential backoff retry policies handle temporary failures, while circuit breakers prevent cascading failures during service outages.",
                "level": 5,
                "tags": ["retry", "circuit-breaker", "resilience"]
            },
            {
                "id": "failure-scenarios",
                "title": "Graceful Failure Handling",
                "content": "When services are unavailable, the application degrades gracefully with cached data, offline modes, and clear user communication about service status.",
                "level": 6,
                "tags": ["failure-handling", "offline", "degradation", "cache"]
            },
            {
                "id": "backend-services",
                "title": "Backend Services",
                "content": "Backend services provide business logic, data processing, and integration with external systems through well-defined APIs.",
                "level": 2,
                "tags": ["backend", "services", "business-logic"]
            },
            {
                "id": "microservices",
                "title": "Microservices Architecture",
                "content": "Services are designed as independent, deployable units with clear boundaries and well-defined interfaces for maximum scalability and maintainability.",
                "level": 3,
                "tags": ["microservices", "scalability", "boundaries"]
            },
            {
                "id": "service-communication",
                "title": "Inter-Service Communication",
                "content": "Services communicate through event-driven patterns and synchronous APIs, with proper error handling and timeout management.",
                "level": 4,
                "tags": ["communication", "events", "apis", "timeouts"]
            },
            {
                "id": "event-patterns",
                "title": "Event-Driven Patterns",
                "content": "Asynchronous events enable loose coupling between services while maintaining data consistency through eventual consistency patterns.",
                "level": 5,
                "tags": ["events", "async", "consistency"]
            },
            {
                "id": "event-sourcing",
                "title": "Event Sourcing Implementation",
                "content": "Critical business events are stored as an immutable log, enabling complete audit trails, replay capabilities, and temporal queries for business intelligence.",
                "level": 6,
                "tags": ["event-sourcing", "audit", "immutable", "replay", "bi"]
            }
        ]
    }',
    now(),
    now()
);