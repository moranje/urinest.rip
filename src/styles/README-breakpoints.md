# Breakpoint tokens

CSS custom properties cannot be used inside `@media` queries (this is a known
limitation of the spec). We therefore mirror the breakpoint tokens declared in
`tokens.css` (`--bp-sm`, `--bp-md`, `--bp-lg`, `--bp-xl`) as well-known integer
values in code review.

| Token     | Value    | Use-case                     | Media-query value                  |
| --------- | -------- | ---------------------------- | ---------------------------------- |
| `--bp-sm` | `480px`  | Small phones (single column) | `599.98px` _max_ / `480px` _min_   |
| `--bp-md` | `600px`  | Large phones / small tablets | `599.98px` _max_ / `600px` _min_   |
| `--bp-lg` | `900px`  | Tablets / small laptops      | `899.98px` _max_ / `900px` _min_   |
| `--bp-xl` | `1200px` | Desktop                      | `1199.98px` _max_ / `1200px` _min_ |

> Use `Xpx - 0.02px` (e.g. `599.98px`) for `max-width` to avoid the 1-pixel
> overlap between min-width and max-width queries (Bootstrap convention).

Always:

- prefer container queries (`@container`) for component-level layout that depends
  on the parent's width (e.g. `result-main` documentation flex direction);
- prefer the listed media breakpoints for page-level layout (header padding,
  landing grid columns);
- annotate `@media` blocks with a comment referencing the token, e.g.
  `/* bp-md: 600px */`.

## Cheat sheet

```css
/* mobile-first additive scale */
.element {
  /* base styles — mobile */
}
@media (min-width: 600px) {
  /* >= bp-md */
}
@media (min-width: 900px) {
  /* >= bp-lg */
}
@media (min-width: 1200px) {
  /* >= bp-xl */
}

/* container query */
.parent {
  container-type: inline-size;
  container-name: foo;
}
@container foo (max-width: 30rem) {
  /* compact layout */
}
```
