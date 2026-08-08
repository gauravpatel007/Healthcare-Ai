## Prompt: Update Only the Existing Hero Section in My React Landing Page

I have an existing multi-section **React + Vite landing page** for a healthcare platform called **LifeOS**.

My website already contains many sections. **Do not redesign, remove, reorder, or modify any section below the first hero section.**

I only want to update the part shown in my uploaded screenshot:

* Navbar
* First hero section
* Hero background
* Animated contour lines
* Floating healthcare icons
* Hero text and buttons
* Health dashboard preview card

Use my current website screenshot as the existing design and the Framer screenshot as the target reference.

Reference website:

```text
https://humorous-alpaca-085813.framer.app/
```

My local website:

```text
http://localhost:5173/
```

## Main Instruction

Inspect my existing React project and locate the component responsible for the first hero section.

Modify only that component and its related styles.

Do not create an entirely new landing page.

Do not touch:

* Features section
* About section
* Pricing section
* Testimonials
* FAQ
* Footer
* Existing routes
* Authentication logic
* Other landing-page sections

The page content below the hero must remain exactly as it currently is.

---

## Target Result

Make my existing first hero section closely match the reference screenshot in:

* Background appearance
* Animated flowing line effect
* Hero height
* Element positioning
* Typography
* Dashboard placement
* Floating icon animations
* Spacing
* Layering
* Responsive behaviour

Keep the existing LifeOS branding and dashboard content.

---

## 1. Replace Only the Hero Background

Change the current dark navy hero background to a premium soft grey background similar to the reference.

Use:

* Medium grey base
* Slight blue tint
* Soft cyan glow on the right
* Subtle blue glow near the bottom
* Smooth radial gradients
* Slow animated gradient movement

Example direction:

```css
.hero-section {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 92% 45%,
      rgba(77, 211, 255, 0.28),
      transparent 32%
    ),
    radial-gradient(
      circle at 45% 100%,
      rgba(49, 112, 255, 0.16),
      transparent 38%
    ),
    linear-gradient(
      135deg,
      #929496 0%,
      #8b8d8f 48%,
      #7f8588 100%
    );
}
```

The background must not be a static image.

Animate the glow positions very slowly using CSS keyframes or Framer Motion.

The movement should be subtle and premium, not distracting.

---

## 2. Add Animated White Contour Lines

This is the most important part.

Add approximately **16–20 horizontal curved SVG lines** across the hero section, similar to the reference.

The lines should:

* Extend across the full width
* Look like topographic contour lines
* Use smooth Bézier curves
* Have different wave shapes
* Be grouped more closely around the middle
* Spread farther apart toward the bottom
* Pass behind the dashboard card
* Be visible around both sides of the dashboard
* Use thin white strokes
* Have no fill
* Use slightly different opacity values
* Move slowly and independently
* Create a subtle parallax effect

Use an absolutely positioned SVG layer:

```jsx
<div className="hero-contour-background" aria-hidden="true">
  <svg
    viewBox="0 0 1600 900"
    preserveAspectRatio="none"
    className="hero-contour-svg"
  >
    {/* multiple animated paths */}
  </svg>
</div>
```

Suggested styling:

```css
.hero-contour-background {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  overflow: hidden;
}

.hero-contour-svg {
  width: 110%;
  height: 100%;
  transform: translateX(-5%);
}

.hero-contour-line {
  fill: none;
  stroke: rgba(255, 255, 255, 0.68);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
}
```

Animate the line group horizontally and vertically by a few pixels.

You may also animate `stroke-dashoffset`.

Do not make all lines move together. Use different durations such as:

```text
12s, 15s, 18s, 21s
```

The animation must loop infinitely and smoothly.

Do not use a PNG or screenshot for the wave effect.

---

## 3. Keep the Existing Navbar Component

Do not rebuild the entire navbar unless necessary.

Preserve its current functionality and LifeOS logo.

Update only its appearance so it resembles the reference:

* White background
* Around 74px height
* Centered container
* LifeOS logo on the left
* Navigation links in the center
* Sign In and Get Started on the right
* Subtle bottom border
* Sticky or fixed at the top
* High `z-index`

Do not remove existing navbar links or click handlers.

On mobile, keep or improve the existing hamburger menu.

---

## 4. Update the Existing Hero Layout

Keep the current text content:

```text
Your Personal AI Health
Operating System
```

Keep the current description:

```text
Monitor your health, chat with AI, track fitness, manage medications,
analyze wellness trends, and improve your lifestyle—all in one
intelligent platform.
```

Keep the existing buttons:

```text
Get Started Free
Watch Demo
```

Reposition them to match the reference.

Hero content order:

```text
AI badge
Heading
Description
Buttons
Dashboard preview
```

Suggested hero height:

```css
min-height: calc(100vh - 74px);
```

The hero should have enough height to show the dashboard preview without cutting it off.

---

## 5. Hero Typography

Change the heading from white to dark navy.

Suggested style:

```css
.hero-title {
  max-width: 850px;
  margin: 0 auto;
  color: #0c172e;
  font-size: clamp(48px, 5vw, 76px);
  line-height: 0.98;
  font-weight: 800;
  letter-spacing: -0.045em;
  text-align: center;
}
```

The title should remain two lines on desktop.

Description:

```css
.hero-description {
  max-width: 650px;
  margin: 24px auto 0;
  color: rgba(40, 62, 94, 0.72);
  font-size: 17px;
  line-height: 1.55;
  text-align: center;
}
```

---

## 6. AI Badge

Keep the existing badge text:

```text
AI-Powered Health Intelligence
```

Restyle it to match the reference:

* Transparent light-blue background
* Thin blue border
* Blue text
* Small activity icon
* Rounded pill
* Positioned above the heading

Example:

```css
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border: 1px solid rgba(37, 111, 255, 0.35);
  border-radius: 999px;
  background: rgba(37, 111, 255, 0.07);
  color: #2368e8;
}
```

---

## 7. CTA Buttons

Preserve all existing click behaviour.

Primary button:

* Blue-to-cyan gradient
* White text
* Rounded pill
* Soft blue shadow
* Small arrow animation on hover

Secondary button:

* White or translucent-white background
* Dark navy text
* Play icon
* Rounded pill
* Thin border
* Backdrop blur

Suggested layout:

```css
.hero-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 28px;
}
```

Do not replace working React Router links with plain buttons.

---

## 8. Reuse the Existing Dashboard Preview

Do not recreate the dashboard from scratch.

Reuse the dashboard preview already visible in my current hero section.

Keep all existing cards and data:

* Health Score
* Heart Rate
* Sleep
* Daily Steps
* Calories Burned
* AI Assistant
* Medicine Reminder
* Weekly Analytics

Only update:

* Main container width
* Position
* Background
* Border
* Shadow
* Border radius
* Internal gaps
* Card alignment

Target container appearance:

```css
.health-dashboard-preview {
  position: relative;
  z-index: 5;
  width: min(900px, calc(100% - 40px));
  margin: 52px auto 0;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 26px;
  background: rgba(229, 231, 234, 0.82);
  backdrop-filter: blur(18px);
  box-shadow:
    0 30px 70px rgba(24, 39, 67, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}
```

The dashboard should overlap the animated contour-line area.

Do not change its existing data source or functionality.

---

## 9. Floating Healthcare Icons

Keep the idea of floating healthcare icons, but make them closer to the reference.

Use icons from `lucide-react`, such as:

* HeartPulse
* Pill
* Stethoscope
* Headphones
* Clock3

Place them around the hero:

* One near the upper-left
* One near the upper-right
* One near the center-right
* One near the lower-right

Each icon should appear inside a small white rounded card.

Example structure:

```jsx
<motion.div
  className="floating-health-icon floating-health-icon--left"
  animate={{
    y: [0, -9, 0],
    rotate: [-4, 2, -4],
  }}
  transition={{
    duration: 5.5,
    repeat: Infinity,
    ease: "easeInOut",
  }}
>
  <HeartPulse size={22} />
</motion.div>
```

Use different animation durations and delays.

Hide selected floating icons on mobile if they overlap content.

---

## 10. Correct Layering

Use the following visual order:

```text
z-index 0: gradient background
z-index 1: animated contour lines
z-index 2: floating icons
z-index 3: hero text and buttons
z-index 5: dashboard preview
z-index 20: navbar
```

Ensure no decorative element blocks clicks.

Use:

```css
pointer-events: none;
```

for the contour-line layer and decorative floating icons.

---

## 11. Entrance Animations

Use Framer Motion for subtle entrance animations.

Animate:

* Badge: fade in and move upward
* Heading: fade in and move upward
* Description: fade in
* Buttons: fade in and move upward
* Dashboard: fade in and slide upward
* Floating icons: continuous floating
* Gradient: slow movement
* Lines: slow movement

Use staggered timing.

Do not add excessive bouncing, zooming, or rotation.

Animations should feel similar to a premium Framer website.

Install packages only if they are not already installed:

```bash
npm install framer-motion lucide-react
```

---

## 12. Responsive Behaviour

### Desktop

* Full navbar
* Two-line heading
* Dashboard around 850–900px wide
* All main floating icons visible
* Full contour-line density

### Tablet

* Dashboard width around 92%
* Smaller heading
* Reduced icon size
* Hide one decorative icon if needed

### Mobile

* Preserve the existing mobile navbar
* Heading size around 42–48px
* Stack CTA buttons vertically
* Dashboard cards should use the current responsive layout
* Hide icons that overlap text
* Reduce contour-line opacity
* Prevent horizontal scrolling
* Keep all sections below the hero untouched

---

## 13. Strict Constraints

* Modify only the navbar and first hero section shown in the uploaded screenshot.
* Do not modify the rest of the landing page.
* Do not replace the entire `App.jsx` unless absolutely required.
* Do not delete existing imports, routes, APIs, state, or handlers.
* Do not change button navigation.
* Do not change dashboard data.
* Do not use an image as the background.
* Do not use Framer-exported code.
* Do not use an iframe.
* Do not create a separate standalone page.
* Do not add a second hero section.
* Do not duplicate the navbar.
* Do not introduce horizontal overflow.
* Reuse existing components wherever possible.

Before coding, inspect the project files and identify the current hero and navbar components.

After editing, provide the complete code only for files that were actually changed or newly created.

Also provide a final list in this format:

```text
Modified:
- src/components/Navbar.jsx
- src/components/HeroSection.jsx
- src/styles/HeroSection.css

Unchanged:
- All landing page sections below HeroSection
- Existing routing
- Existing dashboard data and behaviour
```

The final result should preserve my complete current website while making only the uploaded first section closely resemble the reference Framer hero.
