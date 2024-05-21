import { External } from "./external.js";

type Spec = any;

/**
 * The Set::Head class handles Pods in head mode. Pods in head
 * mode don't use the {Source} and are initialized by a given
 * specification.
 */
export class Head extends External {
  constructor(spec: Spec) {
    super(spec);

    this.specification.version.head = true;
  }
}
