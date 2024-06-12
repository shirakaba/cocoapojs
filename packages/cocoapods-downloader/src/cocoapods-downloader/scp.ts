import { type UICallbacks } from "./base.js";
import type { RemoteFileOptions } from "./remote_file.js";
import { RemoteFile } from "./remote_file.js";

export class Scp extends RemoteFile {
  protected perform_download_head(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  constructor(
    target_path: string,
    url: string,
    options: Partial<RemoteFileOptions>,
    callbacks?: UICallbacks,
  ) {
    super(target_path, url, options, callbacks);
  }

  protected download_file(full_filename: string): void {
    const url = new URL(this.url);

    const port = url.port || "22";
    const source = `${url.username ? url.username + "@" : ""}${url.host}:'${url.pathname}'`;
    Scp.execute_command("scp", ["-P", port, "-q", source, full_filename]);
  }
}
