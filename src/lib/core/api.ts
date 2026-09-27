import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";
import { AppError, toAppError, validationError } from "./errors";
import { logger } from "./logger";

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ ok: true, data }, { status: 201 });
}

export function fail(err: unknown): NextResponse {
  const appError = toAppError(err);
  const log = logger.child("api");
  if (appError.status >= 500) {
    log.error(appError.message, { code: appError.code, details: appError.details });
  } else {
    log.warn(appError.message, { code: appError.code });
  }
  return NextResponse.json(appError.toJSON(), { status: appError.status });
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new AppError("BAD_REQUEST", "Request body must be valid JSON");
  }
  return validate(schema, raw);
}

export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      throw validationError("Request validation failed", err.flatten());
    }
    throw err;
  }
}

export function handleRoute<T>(fn: () => Promise<T>): Promise<NextResponse> {
  return fn()
    .then((data) => ok(data))
    .catch((err) => fail(err));
}