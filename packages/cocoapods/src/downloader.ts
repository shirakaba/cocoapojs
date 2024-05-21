import { cpSync, mkdirSync, rmSync } from "node:fs";

import type { UICallbacks } from "@repo/cocoapods-downloader";
import { for_target, preprocess_options } from "@repo/cocoapods-downloader";

import { Config } from "./config.js";
import { Cache } from "./downloader/cache.js";
import { Request } from "./downloader/request.js";
import { Response } from "./downloader/response.js";
import type { Specification } from "./spec.js";
import { UserInterface } from "./user_interface.js";

export class Downloader {
  static async download(
    request: Request,
    target: string,
    can_cache = true,
    cache_path = Config.instance.cache_root + "Pods",
  ) {
    can_cache &&= !Config.instance.skip_download_cache;
    request = this.preprocess_request(request);
    let result: Response;

    if (can_cache) {
      if (!cache_path) {
        throw new Error("Must provide a `cache_path` when caching.");
      }
      const cache = new Cache(cache_path);
      result = cache.download_pod(request);
    } else {
      if (!target) {
        throw new Error("Must provide a `target` when caching is disabled.");
      }
      const [r1] = await this.download_request(request, target);
      result = r1;
      new PodSourcePreparer(result.spec, result.location).prepare();
    }

    if (target && result.location && target !== result.location) {
      UserInterface.message(
        "Copying #{request.name} from `#{result.location}` to #{UI.path target}",
        "> ",
        undefined,
        () => {
          Cache.read_lock(result.location, () => {
            rmSync(target, { recursive: true });
            cpSync(result.location, target, { recursive: true });
          });
        },
      );
    }
    return result;
  }
  static async download_request(
    request: Request,
    target: string,
  ): Promise<[Response, Record<string, Specification>]> {
    const checkout_options = await this.download_source(target, request.params);

    if (request.released_pod) {
      const spec = request.spec;
      const podspecs: Record<string, Specification> = {
        [request.name]: spec,
      };
      const result = new Response(target, spec, checkout_options);
      return [result, podspecs];
    } else {
      const podspecs: Record<string, Specification> = new Sandbox.PodspecFinder(
        target,
      ).podspecs;
      if (request.spec) {
        podspecs[request.name] = request.spec;
      }
      let spec: Specification | null = null;
      for (const [name, s] of Object.entries(podspecs)) {
        if (request.name === name) {
          spec = s;
        }
      }

      const result = new Response(target, spec, checkout_options);
      return [result, podspecs];
    }
  }

  private static async download_source(
    target: string,
    params: Record<string, string | boolean>,
  ): Promise<Record<string, string | boolean>> {
    rmSync(target, { recursive: true });
    const downloader = for_target(target, params, uiCallbacks);
    await downloader.download();
    mkdirSync(target, { recursive: true });

    return downloader.options_specific()
      ? params
      : downloader.checkout_options();
  }

  private static preprocess_request(request: Request): Request {
    return new Request({
      spec: request.spec,
      released: request.released_pod,
      name: request.name,
      params: preprocess_options(request.params),
    });
  }
}

const uiCallbacks: UICallbacks = {
  async ui_action(message, callback) {
    UserInterface.section(` > ${message}`, "", 1, () => {
      callback();
    });
  },
  async ui_sub_action(message, callback) {
    UserInterface.section(` > ${message}`, "", 2, () => {
      callback();
    });
  },
  async ui_message(message: string) {
    UserInterface.puts(message);
  },
};
