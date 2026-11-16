# API agreement

openapi.yaml is authoritative. Run npm run contract:generate after intentional schema changes to regenerate equivalent openapi.json and compile-time TypeScript wire types. npm run contract:check verifies both generated artifacts and all indexed positive/negative fixtures.

The directory migration and backend integration preserve the agreed methods, fields, IDs, coordinates and errors. See docs/api.md for current implementation status; historical proposal text in the original contract is not a live capability report.

Runtime validation is explicit in server/src/infrastructure/contract.ts using AJV and the YAML schemas. The shared TypeScript package remains type-only. Earlier hand-written drafts remain isolated under /legacy and do not define HTTP behavior.
