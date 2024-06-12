import type { Specification } from "../spec.js";

/**
 * A response to a download request.
 */
export class Response {
  constructor(
    public location: string | undefined,
    public spec: Specification | undefined,
    public checkout_options: Record<string, string | boolean>,
  ) {}
}
