# Panic-Inspired Design System for Lil Widget

**Philosophy:** Minimalist, playful, content-first design with generous whitespace and subtle delightful details.

---

## 🎨 Color Palette

### Primary Colors
```
Accent Yellow:    #fbbf24 (amber-400) - Primary CTAs, highlights
Accent Hover:     #f59e0b (amber-500) - Hover states
Dark Text:        #1a1a1a (neutral-900) - Headlines, primary text
Medium Text:      #6b7280 (gray-600) - Secondary text, labels
```

### Backgrounds
```
White:            #ffffff - Primary background
Light Gray:       #fafafa (gray-50) - Section backgrounds
Very Light:       #f5f5f5 (gray-100) - Hover states, cards
```

### Borders & Dividers
```
Border:           #e5e5e5 (gray-200) - Subtle borders
Divider:          #d1d5db (gray-300) - Section separators
```

### Semantic Colors
```
Success:          #10b981 (emerald-500)
Error:            #ef4444 (red-500)
Warning:          #f59e0b (amber-500)
Info:             #3b82f6 (blue-500)
```

---

## 📝 Typography

### Font Stack
```css
Sans:   -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
Mono:   "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, monospace
```

### Scale
```
Page Title:       text-4xl font-bold (36px, 900 weight)
Section Header:   text-2xl font-bold (24px, 700 weight)
Card Title:       text-lg font-semibold (18px, 600 weight)
Body Large:       text-base (16px, 400 weight)
Body:             text-sm (14px, 400 weight)
Caption:          text-xs (12px, 400 weight)
Label:            text-sm font-medium (14px, 500 weight)
```

### Line Heights
```
Tight:    leading-tight (1.25)
Normal:   leading-normal (1.5)
Relaxed:  leading-relaxed (1.625)
```

---

## 📐 Spacing

### Padding Scale (Panic uses generous spacing)
```
Extra Tight:  p-3  (12px)
Tight:        p-4  (16px)
Normal:       p-6  (24px)  ← Default for cards
Comfortable:  p-8  (32px)  ← Sections
Spacious:     p-12 (48px)  ← Page containers
```

### Gap Scale
```
Tight:        gap-2  (8px)
Normal:       gap-4  (16px)  ← Default
Comfortable:  gap-6  (24px)
Spacious:     gap-8  (32px)
```

### Max Widths
```
Narrow:       max-w-3xl  (768px)  ← Forms, account settings
Standard:     max-w-5xl  (1024px) ← Most pages
Wide:         max-w-6xl  (1152px) ← Dashboard
Full:         max-w-7xl  (1280px) ← Rare, special pages
```

---

## 🔲 Components

### Buttons

**Primary (Accent)**
```tsx
className="bg-amber-400 hover:bg-amber-500 text-neutral-900 font-medium px-6 py-2.5 rounded-lg transition-colors"
```

**Secondary**
```tsx
className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
```

**Outline**
```tsx
className="border-2 border-neutral-900 hover:bg-neutral-50 text-neutral-900 font-medium px-6 py-2.5 rounded-lg transition-colors"
```

**Ghost**
```tsx
className="text-neutral-900 hover:bg-neutral-100 font-medium px-4 py-2 rounded-lg transition-colors"
```

**Destructive**
```tsx
className="bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
```

### Cards
```tsx
className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
```

### Inputs
```tsx
className="w-full border-2 border-neutral-200 focus:border-neutral-900 focus:outline-none rounded-lg px-4 py-2.5 text-sm transition-colors"
```

### Badges
```tsx
className="inline-flex items-center bg-neutral-100 text-neutral-700 text-xs font-medium px-3 py-1 rounded-full"
```

### Dividers
```tsx
<hr className="border-neutral-200 my-8" />
```

---

## 🎭 Visual Style

### Border Radius
```
Small:   rounded-lg  (8px)   ← Buttons, inputs
Medium:  rounded-xl  (12px)  ← Small cards
Large:   rounded-2xl (16px)  ← Cards, sections
Full:    rounded-full        ← Badges, avatars
```

### Shadows (Minimal - Panic style)
```
Subtle:  shadow-sm   ← Cards at rest
Lifted:  shadow-md   ← Cards on hover
Modal:   shadow-xl   ← Modals, popovers
```

### Transitions
```
Fast:    transition-all duration-150
Normal:  transition-colors duration-200  ← Default
Smooth:  transition-all duration-300
```

---

## 🏗️ Layout Patterns

### Navigation Header
```tsx
<div className="border-b border-neutral-200 bg-white">
  <div className="mx-auto max-w-6xl px-6 py-4">
    {/* Content */}
  </div>
</div>
```

### Page Container
```tsx
<div className="min-h-screen bg-neutral-50">
  {/* Header */}
  <div className="mx-auto max-w-6xl px-6 py-12">
    {/* Page content */}
  </div>
</div>
```

### Section
```tsx
<section className="bg-white border border-neutral-200 rounded-2xl p-8">
  <h2 className="text-2xl font-bold mb-6">Section Title</h2>
  {/* Content */}
</section>
```

### Grid Layout
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>
```

---

## ✨ Panic-Specific Touches

### 1. Generous Whitespace
- Use `p-8` or `p-12` for cards instead of `p-4`
- Large gaps between sections (`gap-8` or `gap-12`)
- Wide max-widths with breathing room

### 2. Flat, Clean Design
- Minimal shadows (`shadow-sm` at most)
- No gradients (except subtle accent uses)
- Borders over shadows for separation

### 3. Bold Typography
- Use `font-bold` for headlines
- Use `font-semibold` for card titles
- Regular weight for body text

### 4. Playful Details
- Yellow accent for CTAs (stands out without being aggressive)
- Rounded corners (not too round, `rounded-lg` to `rounded-2xl`)
- Subtle hover states

### 5. Content-First
- Let content breathe
- Don't over-decorate
- Information hierarchy over visual complexity

---

## 🚫 Anti-Patterns (What to Avoid)

❌ Heavy shadows or 3D effects
❌ Multiple bright colors
❌ Excessive borders or decorative elements
❌ Tight spacing or cramped layouts
❌ Overly rounded corners (no `rounded-3xl`)
❌ Busy backgrounds or patterns
❌ Gradient buttons (solid colors only)

---

## 📱 Responsive Breakpoints

```
sm:  640px   - Mobile landscape
md:  768px   - Tablet
lg:  1024px  - Desktop
xl:  1280px  - Large desktop
```

### Mobile-First Approach
```tsx
className="p-4 md:p-8 lg:p-12"  // Progressive enhancement
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

---

## 🎯 Component Examples

### Toast Notification
```tsx
<div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3">
  <span>{message}</span>
  <button className="hover:text-neutral-300">✕</button>
</div>
```

### Empty State
```tsx
<div className="text-center py-12">
  <p className="text-neutral-400 text-sm">No items yet</p>
</div>
```

### Loading State
```tsx
<div className="flex items-center justify-center py-8">
  <div className="text-neutral-400 text-sm">Loading...</div>
</div>
```

---

**Status:** Design system defined, ready for implementation across all pages.
