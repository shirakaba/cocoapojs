import { Base, type UICallbacks } from "./base.js";
import { RemoteFile } from "./remote_file.js";

export class Scp extends RemoteFile {
  constructor(
    target_path: string,
    url: string,
    options: Record<string, unknown>,
    callbacks?: UICallbacks,
  ) {
    super(target_path, url, options, callbacks);
  }

  protected async download_file(full_filename: string): Promise<void> {
    const url = new URL(this.url);

    const port = url.port || "22";
    const source = `${url.username ? url.username + "@" : ""}${url.host}:'${url.pathname}'`;
    await Scp.execute_command("scp", ["-P", port, "-q", source, full_filename]);
  }
}
