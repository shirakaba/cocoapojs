import * as child_process from "node:child_process";
import * as fs from "node:fs";
import { homedir, platform } from "node:os";
import * as path from "node:path";
import { cwd, env } from "node:process";

import { UserInterface } from "./user_interface.js";

// type ConfigRecord = {
//   // eslint-disable-next-line @typescript-eslint/ban-types
//   -readonly [key in keyof Config as Config[key] extends Function
//     ? never
//     : key]: Config[key];
// };

// const configurableKeys: Record<keyof ConfigRecord, true> = {
//   silent: true,
//   allow_root: true,
//   new_version_message: true,
//   skip_download_cache: true,
//   cache_root: true,
//   verbose: true,
//   home_dir: true,
//   repos_dir: true,
//   sources_manager: true,
//   templates_dir: true,
//   installation_root: true,
//   project_root: true,
//   sandbox_root: true,
//   project_pods_root: true,
//   sandbox: true,
//   podfile: true,
//   podfile_path: true,
//   lockfile_path: true,
//   default_test_podfile_path: true,
// };

export class Config {
  static readonly DEFAULTS = {
    verbose: false,
    silent: false,
    skip_download_cache: !!env.COCOAPODS_SKIP_CACHE,
    new_version_message: !!env.COCOAPODS_SKIP_UPDATE_MESSAGE,
    cache_root: path.resolve(homedir(), "Library/Caches/CocoaPods"),
  } as const;

  // /**
  //  * Applies the given changes to the config for the duration of the given
  //  * block.
  //  *
  //  * @param changes
  //  *        the changes to merge temporarily with the current config
  //  *
  //  * @yield [] is called while the changes are applied
  //  */
  // with_changes(changes: ConfigRecord): void {
  //   const old = {} as ConfigRecord;
  //   for (const key in changes) {
  //     if (key in this) {
  //       old[key as keyof ConfigRecord] = this[key as keyof Config];
  //     }
  //   }

  //   //   old = {}
  //   //   changes.keys.each do |key|
  //   //     key = key.to_sym
  //   //     old[key] = send(key) if respond_to?(key)
  //   //   end
  //   //   configure_with(changes)
  //   //   yield if block_given?
  //   // ensure
  //   //   configure_with(old)
  // }

  //----------------------------------------------------------------------------
  // @!group UI

  #silent = false;
  /**
   * Whether CocoaPods should not produce output at all.
   */
  get silent(): boolean {
    return this.#silent;
  }
  set silent(value: boolean) {
    this.#silent = value;
  }

  #allow_root = false;
  /**
   * Whether CocoaPods is allowed to run as root.
   */
  get allow_root(): boolean {
    return this.#allow_root;
  }
  set allow_root(value: boolean) {
    this.#allow_root = value;
  }

  #new_version_message = false;
  /**
   * Whether a message should be printed when a new version of CocoaPods is
   * available.
   */
  get new_version_message(): boolean {
    return this.#new_version_message;
  }
  set new_version_message(value: boolean) {
    this.#new_version_message = value;
  }

  //----------------------------------------------------------------------------
  // @!group Installation

  /**
   * Whether the installer should skip the download cache.
   */
  #skip_download_cache = false;
  get skip_download_cache(): boolean {
    return this.#skip_download_cache;
  }
  set skip_download_cache(value: boolean) {
    this.#skip_download_cache = value;
  }

  //----------------------------------------------------------------------------
  // @!group Cache

  #cache_root = Config.DEFAULTS.cache_root;
  /**
   * The directory where CocoaPods should cache remote data and other
   * expensive-to-compute information.
   */
  get cache_root(): string {
    return this.#cache_root;
  }
  set cache_root(value: string) {
    this.#cache_root = value;
  }

  //----------------------------------------------------------------------------
  // @!group Initialization

  initialize(use_user_settings = true): void {
    // configure_with(DEFAULTS)
    // unless ENV['CP_HOME_DIR'].nil?
    //   @cache_root = home_dir + 'cache'
    // end
    // if use_user_settings && user_settings_file.exist?
    //   require 'yaml'
    //   user_settings_contents = File.read(user_settings_file)
    //   user_settings = YAML.safe_load(user_settings_contents)
    //   configure_with(user_settings)
    // end
    // unless ENV['CP_CACHE_DIR'].nil?
    //   @cache_root = Pathname.new(ENV['CP_CACHE_DIR']).expand_path
    // end
  }

  #verbose = false;
  /**
   * Whether CocoaPods should provide detailed output about the performed
   * actions.
   */
  get verbose() {
    return this.#verbose && !this.silent;
  }

  //----------------------------------------------------------------------------
  // @!group Paths

  #home_dir?: string;
  /**
   * The directory where repos, templates and configuration files are stored.
   */
  get home_dir(): string {
    if (!this.#home_dir) {
      this.#home_dir = env.CP_HOME_DIR
        ? path.resolve(env.CP_HOME_DIR)
        : path.resolve(homedir(), ".cocoapods");
    }

    return this.#home_dir;
  }

  #repos_dir?: string;
  /**
   * The directory where the CocoaPods sources are stored.
   */
  get repos_dir(): string {
    if (!this.#repos_dir) {
      this.#repos_dir = env.CP_REPOS_DIR
        ? path.resolve(env.CP_REPOS_DIR)
        : path.resolve(this.home_dir, "repos");
    }

    return this.#repos_dir;
  }

  #sources_manager?: any;
  /**
   * The source manager for the spec repos in `repos_dir`
   */
  get sources_manager(): any {
    if (this.#sources_manager?.repos_dir === this.repos_dir) {
      return this.#sources_manager;
    }
    throw new Error("TODO: lazy-init this.sources_manager here.");
    // @sources_manager = Source::Manager.new(repos_dir)
  }

  #templates_dir?: string;
  /**
   * The directory where the CocoaPods templates are stored.
   */
  get templates_dir(): string {
    if (!this.#templates_dir) {
      this.#templates_dir = env.CP_TEMPLATES_DIR
        ? path.resolve(env.CP_TEMPLATES_DIR)
        : path.resolve(this.home_dir, "templates");
    }

    return this.#templates_dir;
  }

  #installation_root?: string;
  /**
   * The root of the CocoaPods installation where the Podfile is located.
   */
  get installation_root(): string {
    if (this.#installation_root) {
      return this.#installation_root;
    }

    const current_dir = cwd().normalize("NFKC");
    let current_path = current_dir;
    while (!isRoot(current_path)) {
      const podfile_path = Config.podfile_path_in_dir(current_path);
      if (podfile_path) {
        this.#installation_root = podfile_path;
        if (current_path !== current_dir) {
          UserInterface.puts(`[in ${current_path}]`);
        }
        break;
      }

      current_path = path.dirname(current_path);
    }

    if (!this.#installation_root) {
      this.#installation_root = current_dir;
    }

    return this.#installation_root;
  }
  set installation_root(value: string) {
    this.#installation_root = value;
  }
  get project_root(): string {
    return this.installation_root;
  }

  #sandbox_root?: string;
  /**
   * The root of the sandbox.
   */
  get sandbox_root(): string {
    if (!this.#sandbox_root) {
      this.#sandbox_root = path.resolve(this.installation_root, "Pods");
    }

    return this.#sandbox_root;
  }
  get project_pods_root(): string {
    return this.sandbox_root;
  }

  #sandbox?: any;
  /**
   * The sandbox of the current project.
   */
  get sandbox(): any {
    if (!this.#sandbox) {
      // this.#sandbox = new Sandbox(this.sandbox_root);
      throw new Error("TODO: implement lazy-init of Sandbox");
    }
    return this.#sandbox;
  }

  #podfile?: any;
  /**
   * The Podfile to use for the current execution, or undefined if none is
   * available.
   */
  get podfile(): any {
    if (!this.#podfile) {
      // @podfile ||= Podfile.from_file(podfile_path) if podfile_path
      throw new Error("TODO: implement lazy-init of Podfile");
    }

    return this.#podfile;
  }

  #podfile_path?: string;
  /**
   * The path of the Podfile, or undefined if not found.
   *
   * The Podfile can be named either `CocoaPods.podfile.yaml`,
   * `CocoaPods.podfile` or `Podfile`.  The first two are preferred as they
   * allow to specify an OS X UTI.
   */
  get podfile_path(): string | undefined {
    if (!this.#podfile_path) {
      this.#podfile_path = Config.podfile_path_in_dir(this.installation_root);
    }

    return this.#podfile_path;
  }

  #lockfile_path?: string;
  /**
   * The path of the Lockfile.
   *
   * The Lockfile is named `Podfile.lock`.
   */
  get lockfile_path(): string {
    if (!this.#lockfile_path) {
      this.#lockfile_path = path.resolve(
        this.installation_root,
        "Podfile.lock",
      );
    }

    return this.#lockfile_path;
  }

  #default_test_podfile_path?: string;
  /**
   * Returns the path of the default Podfile test pods.
   *
   * The file is expected to be named `Podfile.test`.
   */
  get default_test_podfile_path(): string {
    if (!this.#default_test_podfile_path) {
      this.#default_test_podfile_path = path.resolve(
        this.templates_dir,
        "Podfile.test",
      );
    }

    return this.#default_test_podfile_path;
  }

  //----------------------------------------------------------------------------
  // @!group Private helpers

  /**
   * The path of the file which contains the user settings.
   */
  private get user_settings_file(): string {
    return path.resolve(this.home_dir, "config.yaml");
  }

  // Giving up on this. JS can't index into `this[#abc]`.
  // /**
  //  * Sets the values of the attributes with the given hash.
  //  *
  //  * @param values_by_key The values of the attributes grouped by key.
  //  */
  // private configure_with(values_by_key: ConfigRecord): void {
  //   for (const key in values_by_key) {
  //     if (typeof values_by_key[key] === "undefined") {
  //       continue;
  //     }

  //     switch (key as keyof ConfigRecord) {
  //       case "sandbox_root": {
  //         this.#sandbox_root = values_by_key.sandbox_root;
  //         break;
  //       }
  //       case "project_pods_root": {
  //         this.#sandbox_root = values_by_key.project_pods_root;
  //         break;
  //       }
  //       default: {
  //         this[`#${key}`] = values_by_key[key as keyof ConfigRecord];
  //         break;
  //       }
  //     }

  //     switch (key as keyof ConfigRecord) {
  //       case "silent": {
  //         this.#silent = values_by_key.silent;
  //         break;
  //       }
  //       case "allow_root": {
  //         this.#allow_root = values_by_key.allow_root;
  //         break;
  //       }
  //       case "new_version_message": {
  //         this.#new_version_message = values_by_key.new_version_message;
  //         break;
  //       }
  //       case "skip_download_cache": {
  //         this.#skip_download_cache = values_by_key.skip_download_cache;
  //         break;
  //       }
  //       case "cache_root": {
  //         this.#cache_root = values_by_key.cache_root;
  //         break;
  //       }
  //       case "verbose": {
  //         this.#verbose = values_by_key.verbose;
  //         break;
  //       }
  //       case "home_dir": {
  //         this.#home_dir = values_by_key.home_dir;
  //         break;
  //       }
  //       case "repos_dir": {
  //         this.#repos_dir = values_by_key.repos_dir;
  //         break;
  //       }
  //       case "sources_manager": {
  //         this.#sources_manager = values_by_key.sources_manager;
  //         break;
  //       }
  //       case "templates_dir": {
  //         this.#templates_dir = values_by_key.templates_dir;
  //         break;
  //       }
  //       case "installation_root": {
  //         this.#installation_root = values_by_key.installation_root;
  //         break;
  //       }
  //       // Alias
  //       // case "project_root": {
  //       //   this.#installation_root = values_by_key.project_root;
  //       //   break;
  //       // }
  //       case "sandbox_root": {
  //         this.#sandbox_root = values_by_key.sandbox_root;
  //         break;
  //       }
  //       // Alias
  //       // case "project_pods_root": {
  //       //   this.#sandbox_root = values_by_key.project_pods_root;
  //       //   break;
  //       // }
  //       case "sandbox": {
  //         this.#sandbox = values_by_key.sandbox;
  //         break;
  //       }
  //       case "podfile": {
  //         this.#podfile = values_by_key.podfile;
  //         break;
  //       }
  //       case "podfile_path": {
  //         this.#podfile_path = values_by_key.podfile_path;
  //         break;
  //       }
  //       case "lockfile_path": {
  //         this.#lockfile_path = values_by_key.lockfile_path;
  //         break;
  //       }
  //       case "default_test_podfile_path": {
  //         this.#default_test_podfile_path =
  //           values_by_key.default_test_podfile_path;
  //         break;
  //       }
  //       default: {
  //         console.warn(`Unrecognized key: '${key}'`);
  //       }
  //     }
  //   }
  // }

  private static readonly PODFILE_NAMES = [
    "CocoaPods.podfile.yaml",
    "CocoaPods.podfile",
    "Podfile",
    "Podfile.rb",
  ] as const;

  /**
   * Returns the path of the Podfile in the given directory, if any exists.
   *
   * @param dir The directory where to look for the Podfile.
   *
   * @returns The path of the Podfile, or undefined if not found.
   */
  static podfile_path_in_dir(dir: string): string | undefined {
    for (const podfileName of Config.PODFILE_NAMES) {
      const candidate = path.resolve(dir, podfileName);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  /**
   * Excludes the given dir from Time Machine backups.
   * @param directory The directory to exclude from Time Machine backups.
   */
  static exclude_from_backup(directory: string): void {
    if (platform() !== "darwin") {
      return;
    }

    child_process.spawnSync(
      "tmutil",
      ["addexclusion", path.resolve(directory)],
      { stdio: "ignore" },
    );
  }

  //----------------------------------------------------------------------------
  // @!group Singleton

  static #instance?: Config;
  /**
   * Returns the current config instance, creating one if needed.
   */
  static get instance(): Config {
    if (!this.#instance) {
      this.#instance = new Config();
    }

    return this.#instance;
  }
  /**
   * Sets the current config instance. If set to null, the config will be
   * recreated.
   */
  static set instance(value: Config | null) {
    this.#instance = value ?? new Config();
  }

  // # Provides support for accessing the configuration instance in other
  // # scopes.
  // #
  // module Mixin
  //   def config
  //     Config.instance
  //   end
  // end
}

/**
 * Determines whether the given file path is the file system's root path.
 */
function isRoot(filePath: string) {
  return filePath === path.parse(path.resolve(filePath)).root;
}
