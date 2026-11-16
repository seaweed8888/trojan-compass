import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import formats from "ajv-formats";
import type { ValidateFunction, ErrorObject } from "ajv";
import { AppError, invalid } from "./errors.js";

export const contract = JSON.parse(
  readFileSync(
    new URL("../../../shared/contracts/openapi.json", import.meta.url),
    "utf8",
  ),
);
export const ajv = new Ajv2020({
  strict: false,
  allErrors: true,
  coerceTypes: false,
  validateFormats: true,
});
(formats as unknown as (instance: Ajv2020) => void)(ajv);
ajv.addSchema({ $id: "compass", components: contract.components });
const validators = new Map<string, ValidateFunction>();
export function warmContracts(): void {
  for (const name of Object.keys(contract.components.schemas)) validator(name);
}

export function validator(name: string): ValidateFunction {
  let validate = validators.get(name);
  if (!validate) {
    validate = ajv.compile({ $ref: `compass#/components/schemas/${name}` });
    validators.set(name, validate);
  }
  return validate;
}

function fields(errors: ErrorObject[] | null | undefined) {
  return (errors ?? []).slice(0, 12).map((e) => ({
    field: e.instancePath || "/",
    message: e.message ?? "Invalid value",
  }));
}

export function validateBody<T>(name: string, value: unknown): T {
  const check = validator(name);
  if (!check(value))
    throw new AppError(
      "INVALID_REQUEST",
      400,
      "The request does not match the API contract.",
      fields(check.errors),
    );
  return value as T;
}

export function assertContract(name: string, value: unknown): void {
  const check = validator(name);
  if (!check(value))
    throw new Error(
      `Contract violation in ${name}: ${JSON.stringify(fields(check.errors))}`,
    );
}

export function validateQuery(
  path: string,
  raw: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const result: Record<string, string | number | boolean> = {};
  const parameters = (contract.paths[path]?.get?.parameters ?? [])
    .map((p: any) =>
      p.$ref ? contract.components.parameters[p.$ref.split("/").at(-1)] : p,
    )
    .filter((p: any) => p.in === "query");
  for (const [key, value] of Object.entries(raw)) {
    const parameter = parameters.find((p: any) => p.name === key);
    if (!parameter || typeof value !== "string")
      throw invalid("Unknown or repeated query parameter.", key);
    let parsed: string | number | boolean = value;
    if (parameter.schema.type === "integer") {
      if (!/^\d+$/.test(value)) throw invalid("Expected an integer.", key);
      parsed = Number(value);
    } else if (parameter.schema.type === "boolean") {
      if (value !== "true" && value !== "false")
        throw invalid("Expected true or false.", key);
      parsed = value === "true";
    }
    const cacheKey = `${path}:${key}`;
    let check = validators.get(cacheKey);
    if (!check) {
      const schema = JSON.parse(
        JSON.stringify(parameter.schema).replaceAll(
          '"#/components/',
          '"compass#/components/',
        ),
      );
      check = ajv.compile(schema);
      validators.set(cacheKey, check);
    }
    if (!check(parsed)) throw invalid(`Invalid ${key}.`, key);
    result[key] = parsed;
  }
  if (result.floorId && path === "/places" && !result.buildingId)
    throw invalid("floorId requires buildingId.", "floorId");
  return result;
}
