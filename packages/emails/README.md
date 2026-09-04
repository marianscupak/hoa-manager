# @hoa-mngr/emails

Transactional email templates for the API, written with React Email and
rendered to HTML plus plain text. The API imports plain async functions —
it never sees React.

## Preview

```sh
pnpm --filter @hoa-mngr/emails preview   # http://localhost:3002
```

Each template is rendered with its `PreviewProps`. Hot reload, desktop and
mobile views, HTML source, and plain-text output are built in.

## Consuming from the API

The API imports the compiled `dist/`, not the source. After editing a
template, run `pnpm --filter @hoa-mngr/emails build`, or have root
`pnpm dev` running (it includes this package's `tsc --watch`).

## Add an email type

1. Create `src/templates/<name>.tsx`: export a props interface, a
   `<name>Subject(props)` function, and a default component built from
   `EmailLayout` and the blocks in `src/components`. Attach `PreviewProps`
   with realistic sample data.
2. Export `render<Name>Email(props)` from `src/index.ts` via `renderTemplate`.
3. Add `src/templates/<name>.spec.tsx`: subject, link in HTML, link and key
   facts in plain text, escaping of user-provided strings.
4. In the API, import `EmailModule`, inject `EMAIL_SENDER`, call
   `render<Name>Email`, then `send({ to, ...rendered })`. Any API Jest spec
   that exercises a handler calling a render function must
   `jest.mock('@hoa-mngr/emails', …)`, because `@react-email/render`
   performs a dynamic `import("react-dom/server")` that Jest's default
   runtime rejects (see `send-owner-invite.handler.spec.ts` for the
   pattern).
5. `pnpm --filter @hoa-mngr/emails test`, then check the preview.

## Theme

`src/theme.ts` mirrors a subset of the colour tokens from
`packages/ui/globals.css`. `theme.spec.ts` fails when they drift — update
the mirror when the design system changes.
