# 03. Performance Optimization Rules

IoT Dashboards displaying real-time data and charts must be highly performant. A drop in FPS or severe input lag is unacceptable.

## React Rendering Optimizations
1. **Memoization (`React.memo`):** 
   Wrap pure leaf components (like a complex chart, or a single device card) in `React.memo` if they receive props that don't change frequently while their parent renders often.
   
2. **`useMemo` & `useCallback`:**
   - Use `useMemo` for expensive calculations (e.g., aggregating monthly energy arrays for charts, filtering large config arrays).
   - Use `useCallback` when passing functions down to memoized child components to prevent breaking their memoization.

## Data Fetching and Loading
1. **Lazy Loading Code:**
   Split the application using `React.lazy` and React Router data APIs. Do not load the "Dashboard" and the "Billing" charts code at the same time if the user is only on the Control Panel.
   
2. **Redis & Backend Caching:**
   - Any backend service developed for this dashboard MUST use a caching layer (like Redis) for querying historical data or large configurations.
   - Frequent API endpoints must not hit the primary Database constantly.

## Throttling and Debouncing
- When receiving high-frequency MQTT data (e.g., 50 messages per second), **throttle** the UI updates. The human eye cannot read 50 UI updates a second. Update the Zustand store immediately, but use a throttled selector for the UI, or debounce the state setter to max 5-10 updates per second.
- Debounce all search inputs and slider controls before sending commands to the MQTT server to avoid flooding the IoT network.

## Asset Optimization
- SVG icons should be optimized.
- Heavy libraries (like Leaflet or Recharts) should be evaluated to assure they are tree-shaken during Vite builds.
