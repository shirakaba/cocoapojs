//TODO: Verificar se já existe alguma biblioteca externa ou implementação semelhante.
import { createHash } from "node:crypto";

// Ref: https://github.com/CocoaPods/Core/blob/master/lib/cocoapods-core/build_type.rb

class BuildType {
  private _linkage: "static" | "dynamic";
  private _packaging: "library" | "framework";
  private _hash: number;

  static readonly KNOWN_PACKAGING_OPTIONS = ["library", "framework"] as const;

  static readonly KNOWN_LINKAGE_OPTIONS = ["static", "dynamic"] as const;

  constructor(
    linkage: "static" | "dynamic" = "static",
    packaging: "library" | "framework" = "library"
  ) {
    if (BuildType.KNOWN_LINKAGE_OPTIONS.indexOf(linkage) === -1) {
      throw new Error(
        `Invalid linkage option ${linkage}, valid options are ${BuildType.KNOWN_LINKAGE_OPTIONS}`
      );
    }

    if (BuildType.KNOWN_PACKAGING_OPTIONS.indexOf(packaging) === -1) {
      throw new Error(
        `Invalid packaging option ${packaging}, valid options are ${BuildType.KNOWN_PACKAGING_OPTIONS}`
      );
    }

    this._packaging = packaging;
    this._linkage = linkage;
    this._hash = packaging.hash ^ linkage.hash;
  }

  static dynamic_library() {
    return new BuildType("dynamic", "library");
  }

  static static_library() {
    return new BuildType("static", "library");
  }

  static dynamic_framwork() {
    return new BuildType("dynamic", "framework");
  }

  static static_framwork() {
    return new BuildType("static", "framework");
  }

  dynamic() {
    return this._linkage === "dynamic";
  }

  static() {
    return this._linkage === "static";
  }

  framework() {
    return this._packaging === "framework";
  }

  library() {
    return this._packaging === "library";
  }

  dynamic_framework() {
    return this.dynamic() && this.framework();
  }

  dynamic_library() {
    return this.dynamic() && this.library();
  }

  static_framework() {
    return this.static() && this.framework();
  }

  static_library() {
    return this.static() && this.library();
  }

  toString(): string {
    return `${this._linkage} ${this._packaging}`;
  }

  toHash(): {
    linkage: "static" | "dynamic";
    packaging: "library" | "framework";
  } {
    return { linkage: this._linkage, packaging: this._packaging };
  }

  inspect(): string {
    return `#<BuildType linkage=${this._linkage} packaging=${this._packaging}>`;
  }

  equals(other: BuildType): boolean {
    return (
      this._linkage === other.linkage && this._packaging === other.packaging
    );
  }

  get linkage() {
    return this._linkage;
  }

  get packaging() {
    return this._packaging;
  }

  get hash() {
    return this._hash;
  }
}

declare global {
  interface String {
    get hash(): number;
  }
}

Object.defineProperty(String.prototype, "hash", {
  get() {
    const hashBuffer = createHash("md5").update(this).digest();

    let hashInt = 0;
    for (let i = 0; i < 4; i++) {
      hashInt = (hashInt << 8) + hashBuffer[i];
    }

    return hashInt;
  },
});
