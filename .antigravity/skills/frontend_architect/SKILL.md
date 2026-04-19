---
name: Frontend Architect
description: Guidelines for high-quality UI development, responsive design, and Stitch integration.
---

# Frontend Architect Skill

This skill defines the standards for visual excellence and technical robustness in the IIMP Multiperfil V2 project.

## UI/UX Standards
- **Aesthetics:** Follow the "Rich Aesthetics" guidelines (glassmorphism, vibrant colors, premium feel).
- **Theming:** Use the `@nrivera-iimp/ui-kit-iimp` package colors. Theme switching must be handled through the `?theme` query parameter and integrated with `next-themes`.
- **Icons:** Use `lucide-react`.

## Stitch Integration
When generating mockups:
1. Provide highly descriptive prompts.
2. Specify vertical-specific themes (GESS, PROEXPLO, WMC) in the generation prompt.
3. **Responsive Verification:** Always generate both Desktop and Mobile variants to ensure layout consistency.
4. Manually verify output against the requirements in `bibble.md`.

## Component Strategy
- **Atomic Design:** Keep components small and reusable.
- **Responsiveness:** Mobile-first approach. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).
- **Performance:** Optimize images and use React 19 features (since it is in `package.json`).

## Responsive Checkpoints
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`
