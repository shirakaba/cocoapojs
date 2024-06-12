import type { UICallbacks } from "./base.js";
import type { RemoteFileOptions } from "./remote_file.js";
import { RemoteFile } from "./remote_file.js";

export class Http extends RemoteFile {
  protected perform_download_head(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  constructor(
    target_path: string,
    url: string,
    options: RemoteFileOptions,
    callbacks?: UICallbacks,
  ) {
    super(target_path, url, options, callbacks);
  }

  protected download_file(full_filename: string): void {
    const parameters = [
      "-f",
      "-L",
      "-o",
      full_filename,
      this.url,
      "--create-dirs",
      "--netrc-optional",
      "--retry",
      "2",
    ];

    if (this._options.headers) {
      const userAgentHeader = this._options.headers.find((key) =>
        key.toLowerCase().includes("user-agent"),
      );

      if (!userAgentHeader) {
        parameters.push(`-A '${Http.user_agent_string()}'`);
      }

      for (const header of this._options.headers) {
        parameters.push("-H", header);
      }
    }

    Http.execute_command("curl", parameters);
  }
}
