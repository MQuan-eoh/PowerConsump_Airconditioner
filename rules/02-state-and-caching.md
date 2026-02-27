# 02. State Management and Caching

Handling state optimally is critical in an IoT Dashboard with real-time data streaming (MQTT) and complex configurations.

## The Problem with Context API
Currently, the app relies heavily on React Context API. For low-frequency updates (e.g., Theme, Language, Auth Auth Status), Context is fine.
**Rule:** DO NOT use Context API for high-frequency, constantly changing real-time data like MQTT telemetry streams. It causes top-down re-rendering of all consumers, destroying performance.

## State Management Standard

### Global Client State -> Zustand (or similar)
- Adopt **Zustand** for atomic, highly performant client-side state.
- Create small, focused slices (e.g., `useDeviceStore`, `useUiStore`).
- Zustand allows accessing state outside of React components, which is perfect for MQTT service listeners injecting data directly into the store without forcing a React context tree to re-evaluate.

### Server State and Caching -> TanStack Query (React Query)
- Use **React Query** for fetching, caching, and updating server data (e.g., fetching Billing info, Device History from Firebase/REST APIs).
- It provides built-in caching, background refetching, and pagination.
- **Redis-like Client Pattern:** React Query acts as a localized Redis store in the browser. It drastically reduces network requests by returning cached data instantly while validating in the background.

## Real-time Data Handling (MQTT)
- Create an MQTT Service that listens to topics.
- When an MQTT message arrives, the Service updates a specific node in a Zustand store.
- Components subscribe **ONLY** to the specific piece of data they need from the store (using Zustand selectors).
   ```typescript
   // Good
   const temperature = useDeviceStore(state => state.devices[id].temperature);
   ```
   This ensures that only the component displaying the temperature re-renders, not the whole application tree.
