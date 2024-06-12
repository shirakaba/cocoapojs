import { hash } from "node:crypto";

import type { Specification } from "../spec.js";

export class Request {
  spec!: Specification;
  released_pod!: boolean;
  name!: string;
  params!: Record<string, string | boolean>;

  constructor({
    spec,
    released,
    name,
    params,
  }: {
    spec?: Specification;
    released?: boolean;
    name?: string;
    params?: Record<string, string | boolean>;
  }) {
    this.released_pod = !!released;
    this.spec = spec!;
    this.params = spec && spec.source ? structuredClone(spec.source) : params!;
    this.name = spec ? spec.name : name!;

    this.validate();
  }

  public slug({
    name = this.name,
    params = this.params,
    spec = this.spec,
  }: {
    name?: string;
    params?: object;
    spec?: Specification;
  }): string {
    const checksum = spec.checksum ? `-${spec.checksum.slice(0, 5)}` : "";

    if (this.released_pod) {
      return `Release/${name}/${spec.version}${checksum}`;
    } else {
      const opts = Object.entries(params)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([k, v]) => `${k}=${v}`)
        .join("-");

      const digest = hash("md5", opts);
      return `External/${name}/${digest}${checksum}`;
    }
  }

  private validate(): void {
    if (!this.name) {
      throw new Error("Requires a name");
    }
    if (this.released_pod && !this.spec) {
      throw new Error("Must give a spec for a released download request");
    }
    if (this.released_pod && !this.spec.version) {
      throw new Error("Requires a version if released");
    }
    if (!this.params) {
      throw new Error("Requires params");
    }
  }
}
