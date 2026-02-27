# 00. AI Generation Guidelines

This file contains strict rules for any AI assistant (Cursor, GitHub Copilot, Agentic AI) generating code for this project.

## Core Directives
1. **Always use TypeScript:** All new files must be `.ts` or `.tsx`. Existing `.js`/`.jsx` files modified heavily should be refactored to TypeScript.
2. **Follow Existing Architectural Patterns:** Adhere to the established layer separation (Components, Hooks, Services, Utils, Config). Do not mix business logic inside UI components.
3. **Optimize for Performance First:** The system handles real-time MQTT data and potentially large configurations. AI must write memoized code, avoid unnecessary Context API re-renders, and use proper state management.
4. **Clean Code is Mandatory:** Adhere to SOLID principles. Keep functions small, pure where possible, and well-documented with JSDoc/TSDoc.
5. **Aesthetics Matter:** This is a premium dashboard. Maintain modern UI aesthetics (framer-motion, robust layout structures, polished CSS/Tailwind if adopted).

## AI Workflow
- **Before Coding:** Read these rule files. Understand the user's intent to scale the system for large configs.
- **When Modifying State:** Prefer robust state solutions (Zustand/RTK/TanStack Query) over raw React Context for high-frequency updates.
- **When adding APIs/Services:** Ensure they are typed, handle errors cleanly, and implement caching strategies where necessary.
- **On Completion:** Review the generated code internally to ensure it doesn't violate any performance rules (e.g., missing `useMemo` on heavy computations).

## Banned Practices for AI
- DO NOT generate deep nested ternary operators.
- DO NOT use `any` type in TypeScript. Always define explicit interfaces or types.
- DO NOT use inline styles heavily. Defer to the overarching styling system.
- DO NOT place large configurations hardcoded in components. Extract to `config/` or fetch from DB.
