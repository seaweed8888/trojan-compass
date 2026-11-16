import type { FieldError } from '@trojan-compass/shared';

export class Failure extends Error {
  constructor(
    public code: string,
    public httpStatus: number,
    message: string,
    public fieldErrors?: FieldError[]
  ) {
    super(message);
  }
}
export function missing(message: string): never {
  throw new Failure('RESOURCE_NOT_FOUND', 404, message);
}
export function invalid(message: string): never {
  throw new Failure('INVALID_REQUEST', 400, message);
}
