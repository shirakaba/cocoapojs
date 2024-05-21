import type { UICallbacks } from "./cocoapods-downloader/base.js";
import { Git } from "./cocoapods-downloader/git.js";
import { Http } from "./cocoapods-downloader/http.js";
import { Scp } from "./cocoapods-downloader/scp.js";

export const downloader_class_by_key = {
  git: Git,
  // hg: Mercurial,
  http: Http,
  scp: Scp,
  // svn: Subversion
};

type Strategy = keyof typeof downloader_class_by_key;

export function strategy_from_options(
  options: Record<string, unknown>,
): Strategy | null {
  const optionKeys = Object.keys(options);
  const common = Object.keys(downloader_class_by_key).filter((key) =>
    optionKeys.includes(key),
  );

  if (common.length === 1) {
    return common[0] as Strategy;
  }
  return null;
}

export function for_target(
  target_path: string,
  options: Record<string, string | boolean>,
  callbacks: UICallbacks,
) {
  const [strategy, klass] = class_for_options(options);
  const url = options[strategy] as string;
  const sub_options = structuredClone(options);
  delete sub_options[strategy];

  return new klass(target_path, url, sub_options, callbacks);
}

export function preprocess_options(
  options: Record<string, string | boolean>,
): Record<string, string | boolean> {
  const [, klass] = class_for_options(options);
  return klass.preprocess_options(options);
}

function class_for_options(
  options: Record<string, unknown>,
): [Strategy, (typeof downloader_class_by_key)[Strategy]] {
  if (!options || options.length === 0) {
    throw new Error("No source URL provided.");
  }

  const strategy = strategy_from_options(options);
  if (!strategy) {
    throw new Error(`Unsupported download strategy ${JSON.stringify(options)}`);
  }

  return [strategy, downloader_class_by_key[strategy]] as const;
}
