/**
 * TODO: port Source
 * @see https://github.com/CocoaPods/Core/blob/master/lib/cocoapods-core/source.rb
 */
type Source = any;
type Specification = any;
type Version = any;

/**
 * A Specification::Set is responsible of handling all the specifications of
 * a Pod. This class stores the information of the dependencies that required
 * a Pod in the resolution process.
 *
 * @note   The order in which the sets are provided is used to select a
 *         specification if multiple are available for a given version.
 *
 * @note   The set class is not and should be not aware of the backing store
 *         of a Source.
 */

export class Set {
  #name: string;
  /** The name of the Pod. */
  get name() {
    return this.#name;
  }

  #sources: Array<Source>;
  /**
   * The sources that contain the specifications for the available versions of
   * a Pod.
   */
  get sources() {
    return this.#sources;
  }

  /**
   * @param name The name of the Pod.
   * @param sources The sources that contain a Pod.
   */
  constructor(
    name: string,
    sources: Source | Array<Source> = new Array<Source>(),
  ) {
    this.#name = name;
    this.#sources = Array.isArray(sources) ? sources : [sources];
  }

  /**
   * @return [Specification] the top level specification of the Pod for the
   *         {#required_version}.
   *
   * @note   If multiple sources have a specification for the
   *         {#required_version}, the order in which they are provided
   *         is used to disambiguate.
   */
  get specification(): Specification {
    if (!this.highest_version_spec_path) {
      // mmmmmm where does this Informative come from
      // TODO: implement Informative error subclass:
      // https://github.com/CocoaPods/Core/blob/d9cdb56b6b5d8bf11ab7b04cc3e01587f6196d8c/lib/cocoapods-core.rb#L12
      // extends StandardError:
      // https://github.com/CocoaPods/Core/blob/master/lib/cocoapods-core/standard_error.rb#L4
      // oh boy
      throw new Error(
        `Could not find the highest version for '${this.name}'. This could be due to an empty ${this.name} directory in a local repository.`,
      );
    }

    // TODO: implement Specification
    // Specification.from_file(highest_version_spec_path)
    throw new Error("TODO: implement Specification");
  }

  /**
   * @returns the top level specification for this set for any version.
   */
  specification_name(): Specification | undefined {
    for (const [source, versions] of this.versions_by_source) {
      const version = versions.at(0);
      if (!version) {
        continue;
      }

      return source.specification(this.name, version).name;
    }
  }

  /**
   * @return the paths to specifications for the given version
   */
  specification_paths_for_version(version: string): Array<string> {
    const sources = this.sources.filter((source) =>
      this.versions_by_source.get(source)?.includes(version),
    );

    return sources.map((source) =>
      source.specification_path(this.name, version),
    );
  }

  // Heya, my chat just crashed
  // signing in again

  #versions?: Array<Version>;
  /**
   * @return all the available versions for the Pod, sorted from highest to
   * lowest.
   */
  get versions(): Array<Version> {
    // TODO: see if it's safe to put this guard back in
    // I think we just fixed a bug in CocoaPods 🤤

    // if (!this.#versions) {
    const all_versions = new globalThis.Set<Version>();
    for (const [, versions] of this.versions_by_source) {
      for (const version of versions) {
        all_versions.add(version);
      }
    }
    this.#versions = [...all_versions].sort().reverse();
    // }

    return this.#versions;
  }

  /**
   * @return The highest version known of the specification.
   */
  get highest_version() {
    // Interesting, implies the versions are always sorted..?
    return this.versions.at(0);
  }

  #highest_version_spec_path?: string;
  /**
   * @return The path of the highest version.
   *
   * @note   If multiple sources have a specification for the
   *         {#required_version}, the order in which they are provided
   *         is used to disambiguate.
   */
  get highest_version_spec_path() {
    if (!this.#highest_version_spec_path) {
      const highest_version_spec_path = this.specification_paths_for_version(
        this.highest_version,
      ).at(0);
      if (!highest_version_spec_path) {
        throw new Error(
          "Unexpectedly unable to evaluate highest_version_spec_path.",
        );
      }
      this.#highest_version_spec_path = highest_version_spec_path;
    }

    return this.#highest_version_spec_path;
  }

  #versions_by_source?: Map<Source, Array<Version>>;
  /**
   * @return all the available versions for the Pod grouped by source.
   */
  get versions_by_source() {
    if (!this.#versions_by_source) {
      const versions_by_source = new Map<Source, Version>();
      for (const source of this.#sources) {
        versions_by_source.set(source, source.versions(this.name));
      }
      this.#versions_by_source = versions_by_source;
    }
    return this.#versions_by_source;
  }

  isEqual(other: unknown): boolean {
    if (!(other instanceof Set)) {
      return false;
    }

    return (
      this.#name === other.name &&
      // TODO: check whether insertion order or anything needs to be respected.
      // I'm not yet clear whether source names are guaranteed to be unique or
      // not.
      this.sources.map(({ name }) => name).join(",") ===
        other.sources.map(({ name }) => name).join(",")
    );
  }

  to_s() {
    return `#<${this.constructor.name} for '${
      this.name
    }' available at '${this.sources.map(({ name }) => name).join(", ")}'>`;
  }
  inspect() {
    return this.to_s();
  }

  /**
   * Returns a hash representation of the set composed by dumb data types.
   *
   * @example
   *
   *   "name" => "CocoaLumberjack",
   *   "versions" => { "master" => [ "1.6", "1.3.3"] },
   *   "highest_version" => "1.6",
   *   "highest_version_spec" => 'REPO/CocoaLumberjack/1.6/CocoaLumberjack.podspec'
   *
   * @return The hash representation.
   */
  to_hash() {
    const versions: Record<string, Array<Version>> = {};
    for (const [source, versions] of this.versions_by_source) {
      versions[source.name] = versions.map((version: Version) =>
        version.to_s(),
      );
    }

    return {
      name: this.name,
      versions,
      highest_version: this.highest_version.to_s(),
      highest_version_spec: this.highest_version_spec_path,
    };
  }
}
