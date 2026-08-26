import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";

export function handleApiError(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid input", issues: error.flatten() },
      { status: 400 },
    );
  }
  console.error(error);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}
