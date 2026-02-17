

# Plan: Add Screenshots to Landing Page

## Overview
Save the three uploaded screenshots and integrate them into the landing page's Value Props section, replacing the empty "Preview" placeholders.

## Screenshots to Save

| Screenshot | Target Path | Usage |
|------------|-------------|-------|
| Module map view | `public/screenshots/module-map.png` | "See everything at once" section |
| Detail panel | `public/screenshots/detail-panel.png` | "Deep dive on demand" section |
| File view with issues | `public/screenshots/issues-view.png` | "Spot problems instantly" section |

## Implementation Steps

### Step 1: Copy Screenshots to Project
Copy the three uploaded images to a new `public/screenshots/` folder:
- `user-uploads://Screenshot_2026-02-01_at_9.51.55 AM.png` → `public/screenshots/module-map.png`
- `user-uploads://Screenshot_2026-02-01_at_9.52.07 AM.png` → `public/screenshots/detail-panel.png`
- `user-uploads://Screenshot_2026-02-01_at_9.53.19 AM.png` → `public/screenshots/issues-view.png`

### Step 2: Update ValueProp Component
Modify the `ValueProp` component in `LandingPage.tsx` to:
- Add an optional `imageSrc` prop
- Replace the placeholder div with an actual `<img>` element when `imageSrc` is provided
- Style the image with rounded corners, border, and shadow to match the design

### Step 3: Pass Image Paths to Each ValueProp
Update the three `ValueProp` calls to include the screenshot paths:
- First ValueProp: `/screenshots/module-map.png`
- Second ValueProp: `/screenshots/detail-panel.png`
- Third ValueProp: `/screenshots/issues-view.png`

## Files to Change

| File | Change |
|------|--------|
| `public/screenshots/module-map.png` | New file (copy from upload) |
| `public/screenshots/detail-panel.png` | New file (copy from upload) |
| `public/screenshots/issues-view.png` | New file (copy from upload) |
| `src/components/landing/LandingPage.tsx` | Add `imageSrc` prop to ValueProp, update component to render images |

## Code Changes Preview

The `ValueProp` component will be updated from:
```tsx
<div className="aspect-[4/3] rounded-2xl bg-gradient-to-br ...">
  <div className="text-muted-foreground/40 text-sm">Preview</div>
</div>
```

To:
```tsx
<div className="aspect-[4/3] rounded-2xl border border-border/50 shadow-lg overflow-hidden">
  <img 
    src={imageSrc} 
    alt={title}
    className="w-full h-full object-cover object-top"
  />
</div>
```

## Result
The three Value Props sections will display actual screenshots of Legend's features instead of empty placeholders, making the landing page look more professional and helping users understand the product.

