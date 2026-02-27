# 01. Architecture and Structural Rules

The project structure must follow a strict separation of concerns to support scalability and large-scale configuration handling without spaghetti code.

## Folder Structure

- **`/src/components`**: Pure, presentational UI components. Avoid putting complex business logic or data fetching here. Use composition.
- **`/src/pages`**: View-level components that compose features together. Should mainly coordinate hooks, context providers (if localized), and layouts.
- **`/src/hooks`**: Custom React hooks (`use...`). All complex state logic and lifecycle side-effects should be extracted into custom hooks.
- **`/src/services`**: API calls, MQTT listeners, Firebase integrators. This layer should be completely UI-agnostic.
- **`/src/utils`**: Pure helper functions, formatters, calculators.
- **`/src/config`**: Static configurations, hardcoded constants, environment variable accessors.
- **`/src/contexts` & `/src/store`**: Global state management. 

## Architectural Principles

1. **Feature-Sliced or Modular Architecture (Encouraged):** 
   As the app grows, consider grouping by feature (e.g., `/features/AirConditioner`, `/features/Billing`) rather than purely technical folders, if files become too numerous.
   
2. **Separation of Logic and View:**
   Never write fetch calls or MQTT connection logic directly inside a `useEffect` inside a UI component. Use a custom hook (e.g., `useMqttData(topic)`) that delegates to a service.

3. **Data Access Layer:**
   Any communication with Firebase or a REST API must go through a Service class/function. Components only know about the Service and the domain models, not the implementation details (e.g., Firestore syntax).

4. **Dependency Injection & IOC (Where Applicable):**
   Services should be designed in a way that makes them easily mockable for testing.

5. **Scale for Large Configs:**
   Large JSON configurations (like device specs, room mappings) must be loaded asynchronously and cached. Do not bundle heavy static JSON files into the main JavaScript chunk if they are not needed immediately upon initial load.
