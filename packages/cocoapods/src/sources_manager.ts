import { Executable } from "./executable.js";

// https://github.com/CocoaPods/CocoaPods/blob/028af0bdfc56df9e1b221a59cf36306690cf2ce4/lib/cocoapods/sources_manager.rb#L9
// eslint-disable-next-line unicorn/no-static-only-class
export class Source {
  // static {
  //   Executable.define_method(this, "git");
  // }
  static ["git!"](command: Array<string>): void {
    Executable.execute_command("git", command, true);
  }
  static git(command: Array<string>): void {
    Executable.execute_command("git", command, false);
  }
  //   extend Executable
  //   executable :git
  //   def repo_git(args, include_error: false)
  //     Executable.capture_command('git', ['-C', repo] + args,
  //                                :capture => include_error ? :merge : :out,
  //                                :env => {
  //                                  'GIT_CONFIG' => nil,
  //                                  'GIT_DIR' => nil,
  //                                  'GIT_WORK_TREE' => nil,
  //                                }
  //                               ).
  //       first.strip
  //   end
  //   def update_git_repo(show_output = false)
  //     Config.instance.with_changes(:verbose => show_output) do
  //       args = %W(-C #{repo} fetch origin)
  //       args.push('--progress') if show_output
  //       git!(args)
  //       current_branch = git!(%W(-C #{repo} rev-parse --abbrev-ref HEAD)).strip
  //       git!(%W(-C #{repo} reset --hard origin/#{current_branch}))
  //     end
  //   rescue
  //     raise Informative, 'CocoaPods was not able to update the ' \
  //       "`#{name}` repo. If this is an unexpected issue " \
  //       'and persists you can inspect it running ' \
  //       '`pod repo update --verbose`'
  //   end
  // end
}
