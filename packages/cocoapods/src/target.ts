import path from "node:path";

import type { BuildType } from "./build_type.js";
import type { Sandbox } from "./sandbox.js";
import { BuildSettings } from "./target/build_settings.js";

type Platform = string;

/**
 * Model class which describes a Pods target.
 *
 * The Target class stores and provides the information necessary for
 * working with a target in the Podfile and its dependent libraries.
 * This class is used to represent both the targets and their libraries.
 */

export class Target {
  static DEFAULT_VERSION = "1.0.0";
  static DEFAULT_NAME = "Default";
  static DEFAULT_BUILD_CONFIGURATIONS = { Release: "release", Debug: "debug" };

  /**
   * @return The sandbox where the Pods should be installed.
   */
  get sandbox() {
    return this.#sandbox;
  }

  /**
   * @return A hash representing the user build
   *         configurations where each key corresponds to the name of a
   *         configuration and its value to its type (`:debug` or `:release`).
   */
  get user_build_configurations() {
    return this.#user_build_configurations;
  }

  /**
   * @return The value for the ARCHS build setting.
   */
  get archs() {
    return this.#archs;
  }

  /**
   * @return the platform of this target.
   */
  get platform() {
    return this.#platform;
  }

  /**
   * @return the build settings for this target.
   */
  get build_settings() {
    return this.#build_settings;
  }

  /**
   * @return the build type for this target.
   */
  get build_type() {
    return this.#build_type;
  }

  /**
   * @return whether the target can be linked to app extensions only.
   */
  get application_extension_api_only() {
    return this.#application_extension_api_only;
  }

  /**
   * @return whether the target must be compiled with Swift's library
   *         evolution support, necessary for XCFrameworks.
   */
  get build_library_for_distribution() {
    return this.#build_library_for_distribution;
  }

  #sandbox: Sandbox;
  #user_build_configurations: Record<string, string>;
  #archs: Array<string>;
  #platform: Platform;
  #build_type: BuildType;

  #application_extension_api_only: boolean;
  #build_library_for_distribution: boolean;
  #build_settings: BuildSettings;

  /**
   * Initialize a new target
   *
   * @param sandbox @see #sandbox
   * @param build_type @see #build_type
   * @param user_build_configurations @see #user_build_configurations
   * @param archs @see #archs
   * @param platform @see #platform
   */
  constructor(
    sandbox: Sandbox,
    build_type: BuildType,
    user_build_configurations: Record<string, string>,
    archs: Array<string>,
    platform: string,
  ) {
    this.#sandbox = sandbox;
    this.#user_build_configurations = user_build_configurations;
    this.#archs = archs;
    this.#platform = platform;
    this.#build_type = build_type;

    this.#application_extension_api_only = false;
    this.#build_library_for_distribution = false;
    this.#build_settings = this.create_build_settings();
  }

  /**
   * @return the name of the library.
   */
  name(): string {
    return this.label();
  }

  /**
   * @return the label for the target.
   */
  label(): string {
    return Target.DEFAULT_NAME;
  }

  /**
   * @return the version associated with this target.
   */
  version(): string {
    return Target.DEFAULT_VERSION;
  }

  /**
   * @return whether the target uses Swift code.
   */
  uses_swift(): boolean {
    return false;
  }

  /**
   * @return whether the target is built dynamically
   */
  build_as_dynamic(): boolean {
    return this.build_type.dynamic();
  }

  /**
   * @return whether the target is built as a dynamic framework
   */
  build_as_dynamic_framework(): boolean {
    return this.build_type.dynamic_framework();
  }

  /**
   * @return whether the target is built as a dynamic library
   */
  build_as_dynamic_library(): boolean {
    return this.build_type.dynamic_library();
  }

  /**
   * @return whether the target is built as a framework
   */
  build_as_framework(): boolean {
    return this.build_type.framework();
  }

  /**
   * @return whether the target is built as a library
   */
  build_as_library(): boolean {
    return this.build_type.library();
  }

  /**
   * @return whether the target is built statically
   */
  build_as_static(): boolean {
    return this.build_type.static();
  }

  /**
   * @return whether the target is built as a static framework
   */
  build_as_static_framework(): boolean {
    return this.build_type.static_framework();
  }

  /**
   * @return whether the target is built as a static library
   */
  build_as_static_library(): boolean {
    return this.build_type.static_library();
  }

  /**
   * @deprecated Prefer {build_as_static_framework}.
   *
   * @return whether the target should build a static framework
   */
  static_framework(): boolean {
    return this.build_as_static_framework();
  }

  /**
   * @return the name to use for the source code module constructed
   *         for this target, and which will be used to import the module in
   *         implementation source files.
   */
  product_module_name(): string {
    return c99ext_identifier(this.label());
  }

  /**
   * @return the name of the product
   */
  product_name(): string {
    return this.build_as_framework()
      ? this.framework_name()
      : this.static_library_name();
  }

  /**
   * @return the name of the product excluding the file extension or
   *         a product type specific prefix, depends on #requires_frameworks?
   *         and #product_module_name or #label
   */
  product_basename(): string {
    return this.build_as_framework()
      ? this.product_module_name()
      : this.label();
  }

  /**
   * @return the name of the framework, depends on #label
   *
   * @note This may not depend on #requires_frameworks? indirectly as it is
   *       used for migration.
   */
  framework_name(): string {
    return `${this.product_module_name()}.framework`;
  }

  /**
   * @return the name of the library, depends on #label
   *
   * @note This may not depend on #requires_frameworks? indirectly as it is
   *       used for migration
   *
   */
  static_library_name(): string {
    return `lib${this.label()}.a`;
  }

  /**
   * @return either "framework" or "static_library", depends on #build_as_framework?.
   */
  product_type(): "framework" | "static_library" {
    return this.build_as_framework() ? "framework" : "static_library";
  }

  /**
   * @return whether the generated target needs to be implemented as a framework
   *
   * @deprecated Prefer {build_as_framework?}.
   */
  requires_frameworks(): boolean {
    return this.build_as_framework();
  }

  /**
   * @return the folder where to store the support files of this library.
   */
  support_files_dir(): string {
    return this.#sandbox.target_support_files_dir(this.name());
  }

  /**
   *
   * @param variant - the variant of the xcconfig. Used to differentiate build configurations.
   *
   * @return the absolute path of the xcconfig file
   */
  xcconfig_path(variant?: string): string {
    return variant
      ? `${this.support_files_dir()}${this.label()}.${variant.replaceAll(/\//, "-").toLowerCase()}.xcconfig`
      : `${this.support_files_dir()}${this.label()}.xcconfig`;
  }

  /**
   * @return the absolute path of the header file which contains
   *         the exported foundation constants with framework version
   *         information and all headers, which should been exported in the
   *         module map.
   */
  umbrella_header_path(): string {
    return path.join(
      path.relative(this.module_map_path(), ".."),
      `${this.label()}-umbrella.h`,
    );
  }

  umbrella_header_path_to_write(): string {
    return path.join(
      path.relative(this.module_map_path_to_write(), ".."),
      `${this.label()}-umbrella.h`,
    );
  }

  /**
   * @return the absolute path of the LLVM module map file that
   *         defines the module structure for the compiler.
   */
  module_map_path(): string {
    return this.module_map_path_to_write();
  }

  /**
   * @return the absolute path of the module map file that
   *         CocoaPods writes. This can be different from `module_map_path`
   *         if the module map gets symlinked.
   */
  module_map_path_to_write(): string {
    const basename = `${this.label()}.modulemap`;
    return path.join(this.support_files_dir(), basename);
  }

  /**
   * @return the absolute path of the bridge support file
   */
  bridge_support_path(): string {
    return path.join(this.support_files_dir(), `${this.label()}.bridgesupport`);
  }

  /**
   * @return the absolute path of the Info.plist file.
   */
  info_plist_path(): string {
    return path.join(this.support_files_dir(), `${this.label()}-Info.plist`);
  }

  /**
   * @return additional entries for the generated Info.plist
   */
  info_plist_entries(): Record<string, string> {
    return {};
  }

  /**
   * @return the path of the dummy source generated by CocoaPods
   */
  dummy_source_path(): string {
    return path.join(this.support_files_dir(), `${this.label()}-dummy.m`);
  }

  /**
   * Mark the target as extension-only.
   * Translates to APPLICATION_EXTENSION_API_ONLY = YES in the build settings.
   */
  mark_application_extension_api_only() {
    this.#application_extension_api_only = true;
  }

  /**
   * Compiles the target with Swift's library evolution support, necessary to
   * build XCFrameworks.
   *
   * Translates to BUILD_LIBRARY_FOR_DISTRIBUTION = YES in the build settings.
   */
  mark_build_library_for_distribution() {
    this.#build_library_for_distribution = true;
  }

  /**
   * @return the absolute path of the prepare artifacts script.
   *
   * @deprecated
   */
  prepare_artifacts_script_path(): string {
    return path.join(this.support_files_dir(), `${this.label()}-artifacts.sh`);
  }

  /**
   * Returns an extension in the target that corresponds to the
   * resource's input extension.
   *
   * @param input_extension - the input extension to map to
   *
   * @return the output extension.
   */
  static output_extension_for_resource(input_extension: string): string {
    switch (input_extension) {
      case ".storyboard": {
        return ".storyboardc";
      }
      case ".xib": {
        return ".nib";
      }
      case ".xcdatamodel": {
        return ".mom";
      }
      case ".xcdatamodeld": {
        return ".momd";
      }
      case ".xcmappingmodel": {
        return ".cdm";
      }
      case ".xcassets": {
        return ".car";
      }
      default: {
        return input_extension;
      }
    }
  }

  static resource_extension_compilable(input_extension: string): boolean {
    return (
      this.output_extension_for_resource(input_extension) !== input_extension &&
      input_extension !== ".xcassets"
    );
  }

  private create_build_settings(): BuildSettings {
    return new BuildSettings(this);
  }
}

/**
 * Transforms the given string into a valid +identifier+ after C99ext
 * standard, so that it can be used in source code where escaping of
 * ambiguous characters is not applicable.
 *
 * @param name - any name, which may contain leading numbers, spaces or invalid characters.
 *
 */
function c99ext_identifier(name: string): string {
  return name.replaceAll(/^(\d)/g, "_$1").replaceAll(/\W/g, "_");
}
