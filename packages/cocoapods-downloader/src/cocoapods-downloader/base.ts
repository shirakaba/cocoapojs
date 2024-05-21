import { mkdirSync } from "node:fs";

import { execa, execaSync } from "execa";

import { version as projectVersion } from "../../../../package.json";
import { VERSION } from "./gem_version.js";

export type UICallbacks = typeof defaultCallbacks;

export abstract class Base<Options extends Record<string, unknown>> {
  protected constructor(
    public target_path: string,
    public url: string,
    public options: Partial<Options>,
    private callbacks: UICallbacks = defaultCallbacks,
  ) {
    // TODO: Validate no unrecognized options?
  }

  get downloader_options(): Array<string> {
    return [];
  }

  get name() {
    return "Base";
  }

  protected async perform_download() {}
  protected async perform_download_head() {}

  async download() {
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

  protected validate_input(): void {}

  static user_agent_string(): string {
    const pods_version = `CocoaPods/${projectVersion}`;

    return `${pods_version}cocoapods-downloader/${VERSION}`;
  }

  static preprocess_options(
    options: Record<string, string | boolean>,
  ): Record<string, string | boolean> {
    return options;
  }

  static execute_commandSync(
    executable: string,
    command: Array<string>,
    raise_on_failure = true,
  ) {
    const result = execaSync(executable, command, {
      reject: !raise_on_failure,
      all: true,
    });

    console.log(result.stdout);

    return result.stdout;
  }

  static async execute_command(
    executable: string,
    command: Array<string>,
    raise_on_failure = true,
  ) {
    const result = await execa(executable, command, {
      reject: !raise_on_failure,
      all: true,
    });

    console.log(result.stdout);

    return result.stdout;
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
