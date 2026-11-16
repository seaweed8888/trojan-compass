import { readFileSync } from 'node:fs';
import { Ajv2020 } from 'ajv/dist/2020.js';
import addFormatsModule from 'ajv-formats';
import { parse } from 'yaml';
import { Failure } from '../middleware/failure.js';

// Resolve from this module in both src/ and dist/, never from process.cwd().
export const repositoryRoot = new URL('../../../', import.meta.url);
export const contract = parse(
  readFileSync(new URL('shared/contracts/openapi.yaml', repositoryRoot), 'utf8')
);
const ajv = new Ajv2020({ strict: false, allErrors: true });
const addFormats = addFormatsModule as unknown as (a: Ajv2020) => void;
addFormats(ajv);
ajv.addSchema({ $id: 'https://compass.local/contract', components: contract.components });
const validators = new Map<string, ReturnType<typeof ajv.compile>>();
export function validate<T>(schema: string, value: unknown, response = false): asserts value is T {
  let validator = validators.get(schema);
  if (!validator) {
    validator = ajv.compile({
      $ref: `https://compass.local/contract#/components/schemas/${schema}`,
    });
    validators.set(schema, validator);
  }
  if (!validator(value))
    throw new Failure(
      response ? 'INTERNAL_ERROR' : 'INVALID_REQUEST',
      response ? 500 : 400,
      response
        ? 'The server produced an invalid response.'
        : 'The request does not match the API contract.',
      response
        ? undefined
        : validator.errors?.map((e) => ({
            field: e.instancePath || '/',
            message: e.message ?? 'Invalid value',
          }))
    );
}
export function validateParameter(schema: object, value: unknown) {
  const key = JSON.stringify(schema);
  let validator = validators.get(key);
  if (!validator) {
    validator = ajv.compile({ ...schema, components: contract.components });
    validators.set(key, validator);
  }
  if (!validator(value))
    throw new Failure(
      'INVALID_REQUEST',
      400,
      'Invalid request parameter.',
      validator.errors?.map((e) => ({
        field: e.instancePath || 'parameter',
        message: e.message ?? 'Invalid value',
      }))
    );
}
