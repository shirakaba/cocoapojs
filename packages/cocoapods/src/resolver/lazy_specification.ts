class Specification {
  // Add necessary properties and methods for Specification
}

// Trying to work out what spec_source is.
// - Pod::Source
//   - https://github.com/CocoaPods/CocoaPods/blob/028af0bdfc56df9e1b221a59cf36306690cf2ce4/lib/cocoapods/sources_manager.rb#L9
// - MockSource (extends Pod::Source)
//   - https://github.com/CocoaPods/CocoaPods/blob/028af0bdfc56df9e1b221a59cf36306690cf2ce4/spec/spec_helper/mock_source.rb#L58
// - Sandbox
//   - https://github.com/CocoaPods/CocoaPods/blob/028af0bdfc56df9e1b221a59cf36306690cf2ce4/lib/cocoapods/sandbox.rb#L257
// class SpecSource {
//   // Add necessary properties and methods for SpecSource
//   specification(name: string, version: string): Specification {
//     // Implement the method
//     return new Specification();
//   }

//   specification_path(name: string, version: string): string {
//     // Implement the method
//     return "";
//   }
// }

class SpecWithSource extends Specification {
  spec_source: SpecSource;

  constructor(spec: Specification, source: SpecSource) {
    super();
    Object.assign(this, spec);
    this.spec_source = source;
  }
}

class LazySpecification extends Specification {
  constructor(
    public name: string,
    public version: string,
    public spec_source: SpecSource,
  ) {
    super();
  }

  subspec_by_name(
    name?: string,
    raise_if_missing = true,
    include_non_library_specifications = false,
  ): SpecWithSource | undefined {
    const subspec =
      !name || name === this.name
        ? this
        : (this.specification as LazySpecification).subspec_by_name(
            name,
            raise_if_missing,
            include_non_library_specifications,
          );

    if (!subspec) {
      return;
    }

    return new SpecWithSource(subspec, this.spec_source);
  }

  #specification?: Specification;
  get specification(): Specification {
    if (!this.#specification) {
      this.#specification = this.spec_source.specification(
        this.name,
        this.version,
      );
    }
    return this.#specification;
  }

  // We cannot directly undefine `is_a?` in TypeScript, but we can use TypeScript's type system to handle this if needed
}

class External {
  constructor(public specification: Specification) {}

  all_specifications(
    _warn_for_multiple_pod_sources: boolean,
    requirement: any,
  ): Array<Specification> {
    if (requirement.satisfied_by(this.specification.version)) {
      return [this.specification];
    }
    return [];
  }
}

class Set {
  private name: string;
  private versions_by_source: Map<SpecSource, Array<string>>;
  private _all_specifications: Map<any, Array<LazySpecification>> = new Map();

  constructor(
    name: string,
    versions_by_source: Map<SpecSource, Array<string>>,
  ) {
    this.name = name;
    this.versions_by_source = versions_by_source;
  }

  all_specifications(
    warn_for_multiple_pod_sources: boolean,
    requirement: any,
  ): Array<LazySpecification> {
    if (!this._all_specifications.has(requirement)) {
      const sources_by_version: Map<string, Array<SpecSource>> = new Map();

      for (const [source, versions] of this.versions_by_source) {
        for (const version of versions) {
          if (requirement.satisfied_by(version)) {
            if (!sources_by_version.has(version)) {
              sources_by_version.set(version, []);
            }
            sources_by_version.get(version)!.push(source);
          }
        }
      }

      if (warn_for_multiple_pod_sources) {
        const duplicate_versions = [...sources_by_version.entries()].filter(
          ([_version, sources]) => sources.length > 1,
        );

        for (const [version, sources] of duplicate_versions) {
          console.warn(
            `Found multiple specifications for \`${this.name} (${version})\`:\n` +
              sources
                .map((s) => `- ${s.specification_path(this.name, version)}`)
                .join("\n"),
          );
        }
      }

      const sorted_versions = [...sources_by_version.entries()].sort(
        ([versionA], [versionB]) => {
          // Sort versions from high to low
          if (versionA > versionB) return -1;
          if (versionA < versionB) return 1;
          return 0;
        },
      );

      const specifications: Array<LazySpecification> = [];

      for (const [version, sources] of sorted_versions) {
        for (const source of sources.reverse()) {
          specifications.push(
            new LazySpecification(this.name, version, source),
          );
        }
      }

      this._all_specifications.set(requirement, specifications);
    }

    return this._all_specifications.get(requirement)!;
  }
}
