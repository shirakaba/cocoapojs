import { Set } from "../set.js";

type Spec = any;
type Specification = any;

/**
 * The Set::External class handles Pods from external sources. Pods from
 * external sources don't use the {Source} and are initialized by a given
 * specification.
 *
 * @note External sources *don't* support subspecs.
 */
export class External extends Set {
  #specification: Specification;
  get specification() {
    return this.#specification;
  }

  constructor(spec: Spec) {
    super(spec.root.name);
    this.#specification = spec.root;
  }

  isEqual(other: unknown): boolean {
    if (!(other instanceof External)) {
      return false;
    }

    if (other.specification !== this.specification) {
      return false;
    }

    return true;
  }

  get versions() {
    return [this.specification.version];
  }
}
