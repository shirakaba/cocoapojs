import { createHash } from "node:crypto";
import {
  copyFileSync,
  createReadStream,
  existsSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from "node:fs";
import path from "node:path";
import { URL } from "node:url";

import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

import { Base, type UICallbacks } from "./base.js";

export interface RemoteFileOptions {
  [key: string]: unknown;

  type: string;
  flatten: boolean;
  sha1: string;
  sha256: string;
  headers: Array<string>;
}

export abstract class RemoteFile extends Base<RemoteFileOptions> {
  download_path: string | null = null;

  protected constructor(
    target_path: string,
    url: string,
    options: Record<string, unknown>,
    callbacks?: UICallbacks,
  ) {
    super(target_path, url, options, callbacks);
  }

  get downloader_options(): Array<string> {
    return ["type", "flatten", "sha1", "sha256", "headers"];
  }

  public checkout_options(): Record<string, string | boolean> {
    return {};
  }

  protected async perform_download() {
    const type = this.type();
    const filename = this.filename_with_type(type);
    this.download_path = path.join(this.target_path, filename);
    await this.download_file(this.download_path);
    await this.verify_checksum(this.download_path);
    this.extract_with_type(filename, this.download_path, type);
  }

  protected abstract download_file(full_filename: string): Promise<void>;

  private type() {
    return this.options.type ?? this.type_with_url(this.url);
  }

  private headers() {
    return this.options.headers;
  }

  private should_flatten() {
    const type = this.type();
    if (this.options.flatten != null) {
      return this.options.flatten;
    } else if (type && ["tgz", "tar", "tbz", "txz"].includes(type)) {
      return true; // those archives flatten by default
    } else {
      return false; //  all others (actually only .zip) default not to flatten
    }
  }

  private type_with_url(url: string) {
    const { pathname } = new URL(url);

    if (pathname.endsWith(".zip")) {
      return "zip";
    } else if (pathname.endsWith(".tgz") || pathname.endsWith(".tar.gz")) {
      return "tgz";
    } else if (pathname.endsWith("tar")) {
      return "tar";
    } else if (pathname.endsWith(".tbz") || pathname.endsWith(".tar.bz2")) {
      return "tbz";
    } else if (pathname.endsWith(".txz") || pathname.endsWith(".tar.xz")) {
      return "txz";
    } else if (pathname.endsWith(".dmg")) {
      return "dmg";
    } else {
      return null;
    }
  }

  private filename_with_type(type: string | null = "zip"): string {
    switch (type) {
      case "zip":
      case "tgz":
      case "tar":
      case "tbz":
      case "txz":
      case "dmg": {
        return `file.${type}`;
      }
      default: {
        throw new Error(`Unsupported file type: ${type}`);
      }
    }
  }

  private extract_with_type(
    filename: string,
    full_filename: string,
    type: string | null = "zip",
  ) {
    const unpack_from = full_filename;
    const unpack_to = this.target_path;

    switch (type) {
      case "zip": {
        RemoteFile.execute_command("unzip", [unpack_from, "-d", unpack_to]);
        break;
      }
      case "tar":
      case "tgz":
      case "tbz":
      case "txz": {
        RemoteFile.execute_command("tar", ["xf", unpack_from, "-C", unpack_to]);
        break;
      }
      case "dmg": {
        this.extract_dmg(unpack_from, unpack_to);
        break;
      }
      default: {
        throw new Error(`Unsupported file type: ${type}`);
      }
    }

    if (this.should_flatten()) {
      const self = path.join(this.target_path, filename);
      const contents = readdirSync(this.target_path).filter(
        (dir) => dir !== self,
      );
      const entry = contents[0];

      if (contents.length === 1 && statSync(entry).isDirectory()) {
        const tmp_entry = entry + ".tmp";
        try {
          renameSync(entry, tmp_entry);

          for (const child of readdirSync(tmp_entry)) {
            renameSync(child, this.target_path);
          }
        } finally {
          rmSync(tmp_entry, { recursive: true });
        }
      }
    }

    if (existsSync(unpack_from)) {
      rmSync(unpack_from, { recursive: true });
    }
  }

  private extract_dmg(unpack_from: string, unpack_to: string) {
    const plist_s = RemoteFile.execute_commandSync("hdiutil", [
      "attach",
      "-plist",
      "-nobrowse",
      unpack_from,
      "-mountrandom",
      unpack_to,
    ]);
    const plist = new DOMParser().parseFromString(plist_s);
    const mount_point = xpath
      .select1('//key[.="mount-point"]/following-sibling::string', plist)
      ?.toString();

    if (!mount_point) {
      throw new Error("Invalid DMG: Missing mount point");
    }
    const files = readdirSync(mount_point);
    for (const file of files) {
      copyFileSync(file, unpack_to);
    }
    RemoteFile.execute_command("hdiutil", ["detach", mount_point]);
  }

  private async hash_file(
    filename: string,
    algorithm: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const hasher = createHash(algorithm);
      const stream = createReadStream(filename);

      stream.on("error", reject);
      stream.on("data", hasher.update);
      stream.on("end", () => resolve(hasher.digest("hex")));
    });
  }

  private async compare_hash(
    filename: string,
    algorithm: string,
    hash: string,
  ) {
    const computed_hash = await this.hash_file(filename, algorithm);

    if (computed_hash !== hash) {
      throw new Error(
        `Verification checksum was incorrect, expected ${hash}, got ${computed_hash}`,
      );
    }
  }

  private async verify_checksum(filename: string) {
    if (this.options.sha256) {
      return this.compare_hash(filename, "sha256", this.options.sha256);
    } else if (this.options.sha1) {
      return this.compare_hash(filename, "sha1", this.options.sha1);
    }
  }
}
