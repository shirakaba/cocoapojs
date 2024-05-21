import type { UICallbacks } from "./base.js";
import { Base } from "./base.js";

export interface CheckoutOptions {
  [key: string]: unknown;
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
    return this.options.commit != null || this.options.tag != null;
  }

  checkout_options(): Pick<CheckoutOptions, "git" | "commit" | "submodules"> {
    return {
      git: this.url,
      commit: this.target_git(["rev_parse", "head"]).trim(),
      submodules: Boolean(this.options["submodules"]),
    };
  }

  static preprocess_options<O extends Partial<CheckoutOptions>>(options: O): O {
    if (!options.branch) {
      return options;
    }

    const input = [options.git, options.commit].flatMap((v) =>
      v == null ? [] : [String(v)],
    );
    if (input.some((v) => v.startsWith("--") || v.includes(" --"))) {
      throw new Error(
        `Provided unsafe input for git ${JSON.stringify(options)}`,
      );
    }

    const command = ["ls-remote", "--", options.git, options.branch].filter(
      (v): v is string => v != null,
    );

    const output = Git.execute_commandSync("git", command);
    const match = Git.commit_from_ls_remote(output, options.branch);

    if (match == null) {
      return options;
    }

    options.commit = match;
    delete options.branch;

    return options;
  }

  private static commit_from_ls_remote(
    output: string,
    branch_name: string | null,
  ): string | null {
    if (branch_name == null) {
      return null;
    }

    const regex = new RegExp(
      `([a-z0-9]*)\\trefs\\/(heads|tags)\\/${escapeRegExp(branch_name)}`,
    );

    const match = output.match(regex);

    return match == null ? null : match[1];
  }

  protected async perform_download(): Promise<void> {
    await this.clone();
    if (this.options.commit != null) {
      return this.checkout_commit(this.options.commit);
    }
  }

  protected async perform_download_head(): Promise<void> {
    return this.clone(true);
  }

  private git(args: Array<string>): string {
    return Git.execute_commandSync("git", args, true);
  }

  private async clone(force_head = false, shallow_clone = true): Promise<void> {
    return this.ui_sub_action("Git download", async () => {
      try {
        this.git(this.clone_arguments(force_head, shallow_clone));
        this.update_submodules();
      } catch (error: unknown) {
        if (
          (error as Error).message.match(
            /^fatal:.*does not support (--depth|shallow capabilities)$/im,
          ) == null
        ) {
          throw error;
        } else {
          return this.clone(force_head, false);
        }
      }
    });
  }

  private update_submodules(): void {
    if (this.options.submodules) {
      this.target_git(["submodule", "update", "--init", "recursive"]);
    }
  }

  private clone_arguments(
    force_head: boolean,
    shallow_clone: boolean,
  ): Array<string> {
    const command = ["clone", this.url, this.target_path, "--template="];

    if (shallow_clone && !this.options.commit) {
      command.push("--single-branch", "--depth", "1");
    }

    const tag_or_branch = this.options.tag || this.options.branch;
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
