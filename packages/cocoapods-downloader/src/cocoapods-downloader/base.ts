import { mkdirSync } from "node:fs";

import { version as projectVersion } from "@repo/cocoapods/package.json" with { type: "json" };
// TODO: distinguish src and dist. Or couple to Bun.
import { Executable } from "@repo/cocoapods/src/index.js";

import { VERSION } from "./gem_version.js";

export type UICallbacks = typeof defaultCallbacks;

export abstract class Base<
  Options extends Record<string, string | boolean | number | Array<string>>,
> {
  protected _options: Partial<Options>;
  static options(): Array<string> {
    return [];
  }
  get options(): Array<keyof Options> {
    return Object.keys(this._options);
  }

  protected constructor(
    public target_path: string,
    public url: string,
    options: Partial<Options>,
    private callbacks: UICallbacks = defaultCallbacks,
  ) {
    this._options = options;

    const supportedOptions = new Set(
      (this.constructor as typeof Base).options(),
    );
    const unrecognized_options = Object.keys(options).filter(
      (option) => !supportedOptions.has(option),
    );
    if (unrecognized_options.length > 0) {
      throw new Error(
        `Unrecognized options ${JSON.stringify(unrecognized_options)}`,
      );
    }
  }

  /**
   * The name of the downloader
   *
   * @example
   * import { Mercurial } from "@repo/cocoapods-downloader/dist/mercurial.js";
   *
   * new Mercurial().name; // returns "Mercurial"
   */
  get name() {
    return this.constructor.name;
  }

  protected abstract perform_download(): Promise<void>;
  protected abstract perform_download_head(): Promise<void>;

  async download(): Promise<void> {
    this.validate_input();
    await this.ui_action(`${this.name} download`, async () => {
      mkdirSync(this.target_path, { recursive: true });
      await this.perform_download();
    });
  }

  async download_head() {
    await this.ui_action(`${this.name} HEAD download`, async () => {
      if (this.head_supported()) {
        await this.perform_download_head();
      } else {
        throw new Error(
          `The ${this.name} downloader does not support the HEAD option.`,
        );
      }

      mkdirSync(this.target_path, { recursive: true });
      await this.perform_download();
    });
  }

  head_supported(): boolean {
    return Object.prototype.hasOwnProperty.call(this, "perform_download_head");
  }

  options_specific(): boolean {
    return true;
  }

  public abstract checkout_options(): Record<string, string | boolean>;

  /**
   * Provides a before-download check for safety of the options in the
   * concrete downloader.
   *
   */
  protected validate_input(): void {
    // No-op, in the case of this base class.
  }

  static user_agent_string(): string {
    return `CocoaPods/${projectVersion} cocoapods-downloader/${VERSION}`;
  }

  static preprocess_options(
    options: Record<string, string | boolean>,
  ): Record<string, string | boolean> {
    // In this base class, we don't do any pre-processing, and just return the
    // options as-is.
    return options;
  }

  static execute_command(
    name: string,
    command: Array<string>,
    raise_on_failure = true,
  ): string {
    // TODO: assess this augmentation found in:
    // https://github.com/CocoaPods/cocoapods-downloader/blob/e6851647294166da0b47f2619cc60b761b77f498/spec/spec_helper.rb
    // # Override hook to suppress executables output.
    // #
    // def execute_command(executable, command, raise_on_failure = false)
    //   require 'shellwords'
    //   command = command.map(&:to_s).map(&:shellescape).join(' ')
    //   output = `\n#{executable} #{command} 2>&1`
    //   check_exit_code!(executable, command, output) if raise_on_failure
    //   output
    // end

    // https://github.com/CocoaPods/cocoapods-downloader/blob/e6851647294166da0b47f2619cc60b761b77f498/lib/cocoapods-downloader/api.rb
    // def execute_command(executable, command, raise_on_failure = false)
    //   require 'shellwords'
    //   command = command.map(&:to_s).map(&:shellescape).join(' ')
    //   output = `\n#{executable} #{command} 2>&1`
    //   check_exit_code!(executable, command, output) if raise_on_failure
    //   puts output
    //   output
    // end

    return Executable.execute_command(name, command, raise_on_failure);
  }

  async ui_action(message: string, callback: () => Promise<void>) {
    return this.callbacks.ui_action(message, callback);
  }

  /**
   * Indicates that a minor action will be performed.
   * The action is passed as a callback.
   */
  async ui_sub_action(message: string, callback: () => Promise<void>) {
    return this.callbacks.ui_sub_action(message, callback);
  }

  /**
   * Prints a UI message.
   */
  ui_message(message: string) {
    return this.callbacks.ui_message(message);
  }
}

// https://github.com/CocoaPods/cocoapods-downloader/blob/e6851647294166da0b47f2619cc60b761b77f498/lib/cocoapods-downloader/api.rb
const defaultCallbacks = {
  /**
   * Indicates that an action will be performed.
   * The action is passed as a callback.
   */
  async ui_action(message: string, callback: () => Promise<void>) {
    console.log(message);
    await callback();
  },

  /**
   * Indicates that a minor action will be performed.
   * The action is passed as a callback.
   */
  async ui_sub_action(message: string, callback: () => Promise<void>) {
    console.log(message);
    await callback();
  },

  /**
   * Prints a UI message.
   */
  ui_message(message: string) {
    console.log(message);
  },
};
