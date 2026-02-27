# 04. Clean Code and TypeScript rules

Writing maintainable code requires discipline. The primary mechanism for ensuring clean code in this project going forward will be TypeScript and strict linting.

## 1. Migration to TypeScript
- new features and files MUST be written in TypeScript (`.ts`/`.tsx`).
- Variables and function returns MUST have explicit types.
- The `any` type is strictly forbidden. Use `unknown` or define a generic generic interface.
- Creating interfaces for all Firebase and MQTT payloads is mandatory. This ensures autocomplete works perfectly and helps AI agents avoid hallucinating payload structures.

## 2. SOLID Principles
- **Single Responsibility:** A component, hook, or class should do one thing. If a component is managing state, fetching data, handling MQTT connections, and rendering 500 lines of UI, it must be broken down.
- **Open/Closed:** Write components that accept props (like children or render functions) so they can be extended without modifying their core logic.
- **Dependency Inversion:** Depend on abstractions (interfaces), not concrete implementations (like hardcoded Firebase imports in a UI component).

## 3. Naming Conventions (Strict)
- Use `PascalCase` for Components, Interfaces, and Types.
- Use `camelCase` for variable names, instances, functions, and files (except components).
- Boolean variables must be prefixed with `is`, `has`, `should`, or `can` (e.g., `isLoading`, `hasError`).
- Event handlers must be prefixed with `handle` (e.g., `handleDeviceToggle`), and props passing handlers prefixed with `on` (e.g., `<Button onClick={handleDeviceToggle} />`).

## 4. Code Structure within Files
1. Imports (External libraries first, then absolute internal imports, lastly relative imports).
2. Interfaces/Types.
3. Component/Function definition.
4. Hooks (State and Effects).
5. Helper/Derivation logic.
6. Return statement (JSX).
