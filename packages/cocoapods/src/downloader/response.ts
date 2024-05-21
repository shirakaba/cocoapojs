import type { Specification } from "../spec.js";

/**
 * A response to a download request.
 */
export class Response {
  constructor(
    public location: string | null,
    public spec: Specification | null = null,
    public checkout_options: Record<string, string | boolean>,
  ) {}
}
