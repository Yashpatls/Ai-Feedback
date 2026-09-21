import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

export function handleApiError(error: unknown) {
  console.error("[API Error]", error);

  if (error instanceof ZodError) {
    return apiError(error.errors.map((e) => e.message).join(", "), 400);
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") return apiError("Unauthorized", 401);
    if (error.message === "Forbidden") return apiError("Forbidden", 403);
    if (error.message === "Not Found") return apiError("Not Found", 404);
    return apiError(error.message, 500);
  }

  return apiError("Internal Server Error", 500);
}
