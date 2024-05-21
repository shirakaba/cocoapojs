import assert from "node:assert";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { red } from "kleur";

import { Downloader } from "../downloader.js";
import { Executable } from "../executable.js";
import { POD_VERSION } from "../gem_version.js";
import { Specification } from "../spec.js";
import { UserInterface } from "../user_interface.js";
import { Request } from "./request.js";
import { Response } from "./response.js";

interface CacheDescriptor {
  spec_file: string;
  name: string;
  version: string;
  release: boolean;
  slug: string;
}

enum FileLockAccess {
  Shared,
  Exclusive,
}

export class Cache {
  constructor(public root: string) {
    this.ensure_matching_version();
  }

  async download_pod(request: Request) {
    try {
      return this.cached_pod(request) || (await this.uncached_pod(request));
    } catch (error) {
      UserInterface.puts(red(`\n[!] Error installing ${request.name}`));
      throw error;
    }
  }

  cache_descriptors_per_pod() {
    const specs_dir = path.join(this.root, "Specs");
    const release_specs_dir = path.join(specs_dir, "Release");
    if (!existsSync(specs_dir)) {
      return {};
    }
    const spec_paths = readdirSync(specs_dir).filter((f) =>
      f.endsWith(".podspec.json"),
    );

    const hash: Record<string, Array<CacheDescriptor>> = {};
    for (const spec_path of spec_paths) {
      const spec = Specification.from_file(spec_path);
      hash[spec.name] ||= [];
      const is_release = spec_path.startsWith(release_specs_dir);
      const request = new Request({ spec, released: is_release });
      hash[spec.name].push({
        spec_file: spec_path,
        name: spec.name,
        version: spec.version,
        release: is_release,
        slug: path.join(this.root, request.slug({})),
      });
    }

    return hash;
  }

  /**
   * Convenience method for acquiring a shared lock to safely read from the cache.
   * See `Cache.lock` for more details.
   */

  static read_lock(
    location: string,
    callback: (location: string) => void,
  ): void {
    Cache.lock(location, FileLockAccess.Shared, callback);
  }

  /**
   * Convenience method for acquiring an exclusive lock to safely write to the cache.
   * See `Cache.lock` for more details.
   */

  static write_lock(
    location: string,
    callback: (location: string) => void,
  ): void {
    Cache.lock(location, FileLockAccess.Exclusive, callback);
  }

  static lock(
    location: string,
    lock_type: FileLockAccess,
    callback: (location: string) => void,
  ): void {
    const lockfile = `${location}.lock`;
    assert(false, "unimplemented");
    // FIXME: How to handle file locking?
    //  - flock (or anything like it) does not exist on nodejs
  }

  /*
    def self.lock(location, lock_type)
      raise ArgumentError, 'no block given' unless block_given?
      lockfile = "#{location}.lock"
      f = nil
      loop do
        f.close if f
        f = File.open(lockfile, File::CREAT, 0o644)
        f.flock(lock_type)
        break if Cache.valid_lock?(f, lockfile)
      end
      begin
        yield location
      ensure
        if lock_type == File::LOCK_SH
          f.flock(File::LOCK_EX)
          File.delete(lockfile) if Cache.valid_lock?(f, lockfile)
        else
          File.delete(lockfile)
        end
        f.close
      end
    end
   */

  /**
   * Ensures the cache on disk was created with the same CocoaPods version as is currently running.
   */
  private ensure_matching_version(): void {
    const version_file = path.join(this.root, "VERSION");

    const version = statSync(version_file).isFile()
      ? readFileSync(version_file, "utf8").trim()
      : null;

    if (version !== POD_VERSION && existsSync(this.root)) {
      rmSync(this.root, { recursive: true, force: true });
    }
    mkdirSync(this.root, { recursive: true });

    writeFileSync(version_file, POD_VERSION);
  }

  private path_for_pod(request: Request, slug_opts = {}): string {
    return path.join(this.root, request.slug(slug_opts));
  }

  private path_for_spec(request: Request, slug_opts = {}): string {
    return path.join(
      this.root,
      "Specs",
      request.slug(slug_opts) + ".podspec.json",
    );
  }

  private cached_pod(request: Request) {
    const cached_spec = this.cached_spec(request);
    const path = this.path_for_pod(request);

    if (!(cached_spec && statSync(path).isDirectory())) {
      return;
    }
    const spec = request.spec || cached_spec;
    return new Response(path, spec, request.params);
  }

  private cached_spec(request: Request) {
    const p = this.path_for_spec(request);
    if (!statSync(p).isFile()) {
      return;
    }

    try {
      return Specification.from_file(p);
    } catch {
      // if JSON Parse error
      return;
    }
  }

  private async uncached_pod(request: Request) {
    const target = mkdtempSync(path.join(tmpdir(), "pod-"));
    const [result, podspecs] = await this.download(request, target);
    result.location = null;

    for (const [name, spec] of Object.entries(podspecs)) {
      const destination = this.path_for_pod(request, {
        name,
        params: result.checkout_options,
      });
      this.copy_and_clean(target, destination, spec);
      this.write_spec(
        spec,
        this.path_for_spec(request, { name, params: result.checkout_options }),
      );
      if (request.name === name) {
        result.location = destination;
      }
    }
    rmSync(target, { recursive: true, force: true });
    return result;
  }

  private async download(
    request: Request,
    target: string,
  ): Promise<[Response, Record<string, Specification>]> {
    return Downloader.download_request(request, target);
  }

  private copy_and_clean(
    source: string,
    destination: string,
    spec: Specification,
  ): void {
    const specs_by_platform = this.group_subspecs_by_platform(spec);
    mkdirSync(path.relative(destination, ".."), { recursive: true });
    Cache.write_lock(destination, () => {
      this.rsync_contents(source, destination);

      // TODO: port this
      // https://github.com/CocoaPods/CocoaPods/blob/028af0bdfc56df9e1b221a59cf36306690cf2ce4/lib/cocoapods/installer/pod_source_preparer.rb#L6
      new PodSourcePreparer(spec, destination).prepare();

      // TODO: port this
      // https://github.com/CocoaPods/CocoaPods/blob/028af0bdfc56df9e1b221a59cf36306690cf2ce4/lib/cocoapods/sandbox/pod_dir_cleaner.rb#L4
      new Sandbox.PodDirCleaner(destination, specs_by_platform).clean();
    });
  }

  // TODO: would be nice to pipe through the rsync progress
  private rsync_contents(source: string, destination: string) {
    Executable.execute_command("rsync", [
      "-a",
      "--exclude=.git",
      "--delete",
      `${source}/`,
      destination,
    ]);
  }

  private group_subspecs_by_platform(
    spec: Specification,
  ): Record<string, Array<Specification>> {
    const specs_by_platform: Record<string, Array<Specification>> = {};
    for (const ss of [spec, ...spec.recursive_subspecs()]) {
      for (const platform of ss.available_platforms) {
        specs_by_platform[platform] ||= [];
        specs_by_platform[platform].push(ss);
      }
    }
    return specs_by_platform;
  }

  private write_spec(spec: Specification, p: string): void {
    mkdirSync(path.dirname(p), { recursive: true });
    Cache.write_lock(p, () => {
      // See https://github.com/CocoaPods/Core/blob/d9cdb56b6b5d8bf11ab7b04cc3e01587f6196d8c/lib/cocoapods-core/specification/json.rb#L13
      writeFileSync(p, spec.to_pretty_json());
    });
  }
}
