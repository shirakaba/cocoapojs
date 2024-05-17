import path from "node:path";
import {
  readFileSync,
  statSync,
  rmSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { Request } from "./request";
import { Response } from "./response";
import { tmpdir } from "node:os";
import { POD_VERSION } from "../gem_version";
import { Specification } from "../spec";
import assert from "node:assert";

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
  root: string;

  constructor(root: string) {
    this.root = root;
    this.ensure_matching_version();
  }

  public async download_pod(request: Request) {
    try {
      this.cached_pod(request) || this.uncached_pod(request);
    } catch (e) {
      // UI.puts("\n[!] Error installing #{request.name}".red)
      throw e;
    }
  }

  public cache_descriptors_per_pod() {
    const specs_dir = path.join(this.root, "Specs");
    const release_specs_dir = path.join(specs_dir, "Release");
    if (!existsSync(specs_dir)) {
      return {};
    }
    const spec_paths = readdirSync(specs_dir).filter((f) =>
      f.endsWith(".podspec.json"),
    );
    return spec_paths.reduce<Record<string, CacheDescriptor[]>>(
      (hash, spec_path) => {
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

        return hash;
      },
      {},
    );
  }

  /**
   * Convenience method for acquiring a shared lock to safely read from the cache.
   * See `Cache.lock` for more details.
   */

  public static read_lock(
    location: string,
    callback: (location: string) => {},
  ) {
    Cache.lock(location, FileLockAccess.Shared, callback);
  }

  /**
   * Convenience method for acquiring an exclusive lock to safely write to the cache.
   * See `Cache.lock` for more details.
   */

  public static write_lock(
    location: string,
    callback: (location: string) => {},
  ) {
    Cache.lock(location, FileLockAccess.Exclusive, callback);
  }

  public static lock(
    location: string,
    lock_type: FileLockAccess,
    callback: (location: string) => {},
  ) {
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
  private ensure_matching_version() {
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
    if (statSync(p).isFile()) {
      try {
        return Specification.from_file(p);
      } catch (e) {
        // if JSON Parse error
        return null;
      }
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

  private download(
    request: Request,
    target: string,
  ): Promise<[Response, Record<string, Specification>]> {
    return Downloader.download_request(request, target);
  }

  private copy_and_clean(
    source: string,
    destination: string,
    spec: Specification,
  ) {
    const specs_by_platform = this.group_subspecs_by_platform(spec);
    mkdirSync(path.relative(destination, ".."), { recursive: true });
    Cache.write_lock(destination, () => {
      this.rsync_contents(source, destination);
      new PodSourcePreparer(spec, destination).prepare();
      new Sandbox.PodDirCleaner(destination, specs_by_platform).clean();
    });
  }

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
  ): Record<string, Specification[]> {
    const specs_by_platform: Record<string, Specification[]> = {};
    for (const ss of [spec, ...spec.recursive_subspecs()]) {
      for (const platform of ss.available_platforms) {
        specs_by_platform[platform] ||= [];
        specs_by_platform[platform].push(ss);
      }
    }
    return specs_by_platform;
  }

  private write_spec(spec: Specification, p: string) {
    mkdirSync(path.dirname(p), { recursive: true });
    Cache.write_lock(p, () => {
      writeFileSync(p, spec.to_pretty_json());
    });
  }
}
