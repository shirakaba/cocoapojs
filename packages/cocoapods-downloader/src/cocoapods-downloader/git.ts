import type { UICallbacks } from "./base.js";
import { Base } from "./base.js";

export interface CheckoutOptions {
  [key: string]: string | boolean | number | Array<string>;
  git: string;
  submodules: boolean;
  commit: string;
  tag: string;
  branch: string;
}

function escapeRegExp(string: string): string {
  return string.replaceAll(/[$()*+.?[\\\]^{|}]/g, "\\$&"); // $& means the whole matched string
}

export class Git extends Base<CheckoutOptions> {
  constructor(
    target_path: string,
    url: string,
    options: Partial<CheckoutOptions>,
    callbacks?: UICallbacks,
  ) {
    super(target_path, url, options, callbacks);
  }

  get downloader_options(): Array<string> {
    return ["commit", "tag", "branch", "submodules"];
  }

  options_specific(): boolean {
    return !!this._options.commit || !!this._options.tag;
  }

  checkout_options(): Pick<CheckoutOptions, "git" | "commit" | "submodules"> {
    return {
      git: this.url,
      commit: this.target_git(["rev_parse", "head"]).trim(),
      submodules: Boolean(this._options.submodules),
    };
  }

  static preprocess_options<O extends Partial<CheckoutOptions>>(options: O): O {
    if (!options.branch) {
      return options;
    }

    const input = [options.git, options.commit].flatMap((v) =>
      v ? [String(v)] : [],
    );
    if (input.some((v) => v.startsWith("--") || v.includes(" --"))) {
      throw new Error(
        `Provided unsafe input for git ${JSON.stringify(options)}`,
      );
    }

    const command = ["ls-remote", "--", options.git, options.branch].filter(
      (v): v is string => !!v,
    );

    const output = Git.execute_command("git", command);
    const match = Git.commit_from_ls_remote(output, options.branch);

    if (!match) {
      return options;
    }

    options.commit = match;
    delete options.branch;

    return options;
  }

  private static commit_from_ls_remote(
    output: string,
    branch_name: string | undefined,
  ): string | undefined {
    if (!branch_name) {
      return undefined;
    }

    const regex = new RegExp(
      `([a-z0-9]*)\\trefs\\/(heads|tags)\\/${escapeRegExp(branch_name)}`,
    );

    return output.match(regex)?.[1];
  }

  protected async perform_download(): Promise<void> {
    await this.clone();
    if (this._options.commit) {
      return this.checkout_commit(this._options.commit);
    }
  }

  protected async perform_download_head(): Promise<void> {
    return this.clone(true);
  }

  private git(args: Array<string>): string {
    return Git.execute_command("git", args, true);
  }

  private async clone(force_head = false, shallow_clone = true): Promise<void> {
    return this.ui_sub_action("Git download", async () => {
      try {
        this.git(this.clone_arguments(force_head, shallow_clone));
        this.update_submodules();
      } catch (error: unknown) {
        if (
          !/^fatal:.*does not support (--depth|shallow capabilities)$/im.test(
            (error as Error).message,
          )
        ) {
          throw error;
        }

        return this.clone(force_head, false);
      }
    });
  }

  private update_submodules(): void {
    if (this._options.submodules) {
      this.target_git(["submodule", "update", "--init", "recursive"]);
    }
  }

  private clone_arguments(
    force_head: boolean,
    shallow_clone: boolean,
  ): Array<string> {
    const command = ["clone", this.url, this.target_path, "--template="];

    if (shallow_clone && !this._options.commit) {
      command.push("--single-branch", "--depth", "1");
    }

    const tag_or_branch = this._options.tag || this._options.branch;
    if (!force_head && tag_or_branch) {
      command.push("--branch", tag_or_branch);
    }

    return command;
  }

  private checkout_commit(hash: string): void {
    this.target_git(["checkout", "--quiet", hash]);
    this.update_submodules();
  }

  private target_git(args: Array<string>): string {
    return this.git(["-C", this.target_path, ...args]);
  }
}
