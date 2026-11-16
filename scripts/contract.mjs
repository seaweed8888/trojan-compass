// YAML is authoritative. Regenerate JSON and TypeScript with npm run contract:generate.
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../server/package.json', import.meta.url));
const { parse } = require('yaml');
const Ajv = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');
const root = new URL('../', import.meta.url);
const contract = parse(await readFile(new URL('shared/contracts/openapi.yaml', root), 'utf8'));
const schemas = contract.components.schemas;
function type(s) {
  if (s.$ref) return s.$ref.split('/').at(-1);
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map(JSON.stringify).join(' | ');
  if (s.allOf) return '(' + s.allOf.map(type).join(' & ') + ')';
  if (s.oneOf || s.anyOf) return '(' + (s.oneOf ?? s.anyOf).map(type).join(' | ') + ')';
  if (Array.isArray(s.type))
    return '(' + s.type.map((t) => type({ ...s, type: t })).join(' | ') + ')';
  if (s.type === 'array') return `Array<${type(s.items ?? {})}>`;
  if (s.type === 'object' || s.properties) {
    const props = Object.entries(s.properties ?? {}).map(
      ([k, v]) => `${JSON.stringify(k)}${s.required?.includes(k) ? '' : '?'}: ${type(v)};`
    );
    if (s.additionalProperties && typeof s.additionalProperties === 'object')
      props.push(`[key: string]: ${type(s.additionalProperties)};`);
    return '{ ' + props.join(' ') + ' }';
  }
  return ['string', 'number', 'boolean', 'null'].includes(s.type)
    ? s.type
    : s.type === 'integer'
      ? 'number'
      : 'unknown';
}
const types =
  '// Generated from shared/contracts/openapi.yaml. Do not edit. Compile-time types only.\n\n' +
  Object.entries(schemas)
    .map(([name, s]) => `export type ${name} = ${type(s)};`)
    .join('\n') +
  '\n';
const outputs = [
  ['shared/contracts/openapi.json', JSON.stringify(contract, null, 2) + '\n'],
  ['shared/typescript/src/generated/api-types.ts', types],
];
for (const [path, expected] of outputs) {
  if (process.argv.includes('--generate')) await writeFile(new URL(path, root), expected);
  else if ((await readFile(new URL(path, root), 'utf8')).replaceAll('\r\n', '\n') !== expected)
    throw new Error(`${path} is stale; run npm run contract:generate`);
}
const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const base = { $id: 'https://trojan-compass.local/contract', components: { schemas } };
ajv.addSchema(base);
const fixtures = JSON.parse(
  await readFile(new URL('shared/fixtures/fixture-index.json', root), 'utf8')
);
for (const fixture of fixtures) {
  const validate = ajv.compile({ $ref: `${base.$id}#/components/schemas/${fixture.schema}` });
  const value = JSON.parse(
    await readFile(new URL(`shared/fixtures/${fixture.file}`, root), 'utf8')
  );
  if (Boolean(validate(value)) !== fixture.valid)
    throw new Error(`${fixture.file}: ${JSON.stringify(validate.errors)}`);
}
console.log(`Contract artifacts current; ${fixtures.length} fixtures validated.`);
