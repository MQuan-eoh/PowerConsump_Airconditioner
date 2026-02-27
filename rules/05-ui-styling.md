# 05. UI and Styling Rules

The dashboard requires a premium aesthetic, modern layout components, and a robust way to handle dynamic configurations.

## Responsive Design
- The dashboard is primarily viewed on desktops/tablets but must be fully functional on mobile.
- Use a mobile-first approach when writing custom CSS.
- Ensure that large configurations (like 50+ device cards) wrap properly using CSS Grid or Flexbox.

## Styling Standardization
1. **Move Away from Global CSS where possible:** Avoid putting 1000 lines of CSS in `index.css`.
2. **Component-Scoped Styles:** Prefer CSS Modules, Styled Components, or a utility-first framework like Tailwind CSS (Highly Recommended).
3. **Avoid Inline Styles:** Do not use `style={{ color: 'red', marginTop: '10px' }}` for structural styling. It disrupts caching and causes performance impacts on render. Inline styles are only acceptable for dynamically calculated values (e.g., a progress bar width percentage `style={{ width: `${progress}%` }}`).

## Framer Motion
- Animations are used to make the UI feel premium and responsive.
- **Rule:** Do not overuse heavy animations. Entering animations (fade-in, slide-up) are great for initial mount, but animating elements that update 10 times a second via MQTT will destroy performance.
- Use `layout` prop in framer-motion carefully on lists that reorder dynamically.

## Reusable UI Core
- Build standard `Button`, `Card`, `Modal`, `Input` components. Do not copy/paste raw `<button className="...">` everywhere.
- Make them configurable to handle varying use cases (e.g., varying sizes, variants like 'primary', 'danger').
