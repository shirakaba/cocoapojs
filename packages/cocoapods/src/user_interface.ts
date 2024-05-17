/* eslint-disable unicorn/no-hex-escape */
import * as path from "node:path";
import { cwd } from "node:process";

import { Config } from "./config.js";

// We could model this as either a namespace or a fully-static class. As
// namespaces are generally discouraged in TypeScript, we'll go with the latter.
//
// https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/user_interface.rb
export class UserInterface {
  static readonly title_colors = ["yellow", "green"];
  static readonly title_color_map = {
    yellow: "[33m",
    green: "[32m",
  } as const;
  static title_level = 0;
  static indentation_level = 2;
  static treat_titles_as_messages = false;
  static warnings: ReadonlyArray<any> = new Array<any>();

  static output_io: any;
  static disable_wrap = false;

  private static readonly config = Config.instance;

  /**
   * Prints a title taking an optional verbose prefix and a relative indentation
   * valid for the UI action in the passed block.
   *
   * In verbose mode titles are printed with a color according to their level.
   * In normal mode titles are printed only if they have nesting level smaller
   * than 2.
   *
   * @todo Refactor to title (for always visible titles like search) and
   *       sections (titles that represent collapsible sections).
   *
   * @param title
   *        The title to print
   *
   * @param verbose_prefix
   *        See #message
   *
   * @param relative_indentation
   *        The indentation level relative to the current, when the message is
   *        printed.
   *
   * @param callback
   *        An optional callback to run before restoring the indentation and
   *        title levels.
   */
  static section(
    title: string,
    verbose_prefix = "",
    relative_indentation = 0,
    callback?: (...args: Array<unknown>) => void,
  ) {
    try {
      if (this.config.verbose) {
        this.title(title, verbose_prefix, relative_indentation);
      } else if (this.title_level < 1) {
        this.puts(title);
      }

      this.indentation_level += relative_indentation;
      this.title_level++;

      callback?.();
    } finally {
      this.indentation_level -= relative_indentation;
      this.title_level--;
    }
  }

  /**
   * In verbose mode it shows the sections and the contents.
   * In normal mode it just prints the title.
   *
   */
  static titled_section(
    title: string,
    options: { relative_indentation?: number; verbose_prefix?: string } = {},
    callback?: (...args: Array<unknown>) => void,
  ): void {
    const relative_indentation = options.relative_indentation ?? 0;
    const verbose_prefix = options.verbose_prefix ?? "";

    try {
      if (this.config.verbose) {
        this.title(title, verbose_prefix, relative_indentation);
      } else {
        this.puts(title);
      }

      this.indentation_level += relative_indentation;
      this.title_level++;

      callback?.();
    } finally {
      this.indentation_level -= relative_indentation;
      this.title_level--;
    }
  }

  /**
   * A title opposed to a section is always visible
   *
   * @param title
   *        The title to print
   *
   * @param verbose_prefix
   *        See #message
   *
   * @param relative_indentation
   *        The indentation level relative to the current,
   *        when the message is printed.
   */
  static title(
    title: string,
    verbose_prefix = "",
    relative_indentation = 2,
    callback?: (...args: Array<unknown>) => void,
  ): void {
    try {
      if (this.treat_titles_as_messages) {
        this.message(title, verbose_prefix);
      } else {
        if (this.config.verbose) {
          title = `${verbose_prefix}${title}`;
        }
        if (this.title_level < 2) {
          title = `\n${title}`;
        }
        const color = this.title_colors[this.title_level];
        const color_code = this.title_color_map[
          color as keyof (typeof UserInterface)["title_color_map"]
        ] as string | undefined;

        if (color && color_code) {
          // TODO: check if this is actually correct! Not sure if we need to
          // clear the color code or not.
          // eslint-disable-next-line unicorn/no-hex-escape
          title = `\x1B${color_code}${title}\x1B[0m`;
        }

        this.puts(title);
      }

      this.indentation_level += relative_indentation;
      this.title_level++;
      callback?.();
    } finally {
      this.indentation_level -= relative_indentation;
      this.title_level--;
    }
  }

  /**
   * Prints a verbose message taking an optional verbose prefix and
   * a relative indentation valid for the UI action in the passed
   * block.
   *
   * @todo Clean interface.
   *
   * @param message
   *        The message to print.
   *
   * @param verbose_prefix
   *        See #message
   *
   * @param relative_indentation
   *        The indentation level relative to the current,
   *        when the message is printed.
   *
   * @yield  The action, this block is always executed.
   */
  static message(
    message: string,
    verbose_prefix = "",
    relative_indentation = 2,
    callback?: (...args: Array<unknown>) => void,
  ): void {
    try {
      if (this.config.verbose) {
        message = `${verbose_prefix}${message}`;
        this.puts_indented(message);
      }

      this.indentation_level += relative_indentation;
      callback?.();
    } finally {
      this.indentation_level -= relative_indentation;
    }
  }

  /**
   * Prints an info to the user. The info is always displayed.
   * It respects the current indentation level only in verbose
   * mode.
   *
   * Any title printed in the optional block is treated as a message.
   *
   * @param message
   *        The message to print.
   */
  static info(
    message: string,
    callback?: (...args: Array<unknown>) => void,
  ): void {
    try {
      const indentation = this.config.verbose ? this.indentation_level : 0;
      const indented = this.wrap_string(message, indentation);
      this.puts(indented);
      this.indentation_level += 2;
      this.treat_titles_as_messages = true;
      callback?.();
    } finally {
      this.treat_titles_as_messages = false;
      this.indentation_level -= 2;
    }
  }

  /**
   * Prints an important message to the user.
   *
   * @param message The message to print.
   */
  static notice(message: string): void {
    const greenMessage = `\x1B${this.title_color_map.green}${message}\x1B[0m`;
    this.puts(`\n[!] ${greenMessage}`);
  }

  /**
   * Returns a string containing relative location of a path from the Podfile.
   * The returned path is quoted. If the argument is nil it returns the
   * empty string.
   *
   * @param pathname The path to print.
   */
  static path(pathname: string): string {
    if (!pathname) {
      return "";
    }

    let from_path: string;
    if (this.config.podfile_path) {
      from_path = path.dirname(this.config.podfile_path);
    }
    from_path ||= cwd();

    try {
      return path.relative(from_path, pathname);
    } catch {
      return pathname;
    }
  }

  /**
   * Prints the textual representation of a given set.
   *
   * @param  set
   *         the set that should be presented.
   *
   * @param  mode
   *         the presentation mode, either `:normal` or `:name_and_version`.
   */
  static pod(
    set: Set<unknown>,
    mode: "normal" | "name_and_version" = "normal",
  ): void {
    // if mode == :name_and_version
    //   puts_indented "#{set.name} #{set.versions.first.version}"
    // else
    //   pod = Specification::Set::Presenter.new(set)
    //   title = "-> #{pod.name} (#{pod.version})"
    //   if pod.spec.deprecated?
    //     title += " #{pod.deprecation_description}"
    //     colored_title = title.red
    //   else
    //     colored_title = title.green
    //   end
    //   title(colored_title, '', 1) do
    //     puts_indented pod.summary if pod.summary
    //     puts_indented "pod '#{pod.name}', '~> #{pod.version}'"
    //     labeled('Homepage', pod.homepage)
    //     labeled('Source',   pod.source_url)
    //     labeled('Versions', pod.versions_by_source)
    //     if mode == :stats
    //       labeled('Authors',  pod.authors) if pod.authors =~ /,/
    //       labeled('Author',   pod.authors) if pod.authors !~ /,/
    //       labeled('License',  pod.license)
    //       labeled('Platform', pod.platform)
    //       labeled('Stars',    pod.github_stargazers)
    //       labeled('Forks',    pod.github_forks)
    //     end
    //     labeled('Subspecs', pod.subspecs)
    //   end
    // end

    if (mode === "name_and_version") {
      this.puts_indented(`${set.get("name")}`);
    }
  }

  /**
   * Prints a message with a label.
   *
   * @param label
   *        The label to print.
   *
   * @param value
   *        The value to print.
   *
   * @param justification
   *        The justification of the label.
   */
  static labeled(label: string, value: unknown, justification = 12): void {
    if (!value) {
      return;
    }

    const title = `- ${label}`;
    if (!Array.isArray(value)) {
      this.puts();

      this.wrap_string(
        `${title.padEnd(justification)}${value}`,
        this.indentation_level,
      );
      return;
    }

    const lines = [this.wrap_string(title, this.indentation_level)];
    for (const element of value) {
      lines.push(this.wrap_string(`- ${element}`, this.indentation_level + 2));
    }

    this.puts(lines.join("\n"));
  }

  /**
   * Prints a message respecting the current indentation level and
   * wrapping it to the terminal width if necessary.
   *
   * @param message
   *        The message to print.
   */
  static puts_indented(message = ""): void {
    this.puts(this.wrap_string(message, this.indentation_level));
  }

  /**
   * Prints the stored warnings. This method is intended to be called at the
   * end of the execution of the binary.
   */
  static print_warnings(): void {
    // This is most likely totally unnecessary as stdout should be flushed
    // already, at least for terminals on POSIX. But might as well have some
    // code here to document intent.
    // https://nodejs.org/docs/latest/api/process.html#a-note-on-process-io
    console.log("");

    for (const warning of this.warnings) {
      if (warning.verbose_only && !this.config.verbose) {
        continue;
      }

      const yellow = this.title_color_map.yellow;
      console.warn(`\x1B${yellow}\n[!] ${warning.message}\x1B[0m`);

      for (const action of warning.actions) {
        this.puts(this.wrap_string(`- ${action}`, 4));
      }
    }
  }

  /**
   * Presents a choice among the elements of an array to the user.
   *
   * @param  [Array<#to_s>] array
   *         The list of the elements among which the user should make his
   *         choice.
   *
   * @param  [String] message
   *         The message to display to the user.
   *
   * @return [Fixnum] The index of the chosen array item.
   */
  static choose_from_array(array: Array<unknown>, message: string): number {
    // array.each_with_index do |item, index|
    //   UI.puts "#{index + 1}: #{item}"
    // end
    // UI.puts message
    // index = UI.gets.chomp.to_i - 1
    // if index < 0 || index > array.count - 1
    //   raise Informative, "#{index + 1} is invalid [1-#{array.count}]"
    // else
    //   index
    // end
  }

  // public

  // # @!group Basic methods
  // #-----------------------------------------------------------------------#

  /**
   * prints a message followed by a new line unless config is silent.
   *
   * @param message
   *        The message to print.
   */
  static puts(message = ""): void {
    // return if config.silent?
    // begin
    //   (output_io || STDOUT).puts(message)
    // rescue Errno::EPIPE
    //   exit 0
    // end
  }

  /**
   * prints a message followed by a new line unless config is silent.
   *
   * @param message
   *        The message to print.
   */
  static print(message: string): void {
    // return if config.silent?
    // begin
    //   (output_io || STDOUT).print(message)
    // rescue Errno::EPIPE
    //   exit 0
    // end
  }

  /**
   * gets input from $stdin
   */
  static gets(): any {
    // $stdin.gets
  }

  /**
   * Stores important warning to the user optionally followed by actions
   * that the user should take. To print them use {#print_warnings}.
   *
   * @param message The message to print.
   * @param actions The actions that the user should take.
   * @param verbose_only
   *        Restrict the appearance of the warning to verbose mode only
   */
  static warn(
    message: string,
    actions: Array<any> = [],
    verbose_only = false,
  ): void {
    // warnings << { :message => message, :actions => actions, :verbose_only => verbose_only }
  }

  /**
   * Pipes all output inside given block to a pager.
   *
   * @yield Code block in which inputs to {#puts} and {#print} methods will be printed to the piper.
   */
  static with_pager(): void {
    //   prev_handler = Signal.trap('INT', 'IGNORE')
    //   IO.popen((ENV['PAGER'] || 'less -R'), 'w') do |io|
    //     UI.output_io = io
    //     yield
    //   end
    // ensure
    //   Signal.trap('INT', prev_handler)
    //   UI.output_io = nil
  }

  // private

  // # @!group Helpers
  // #-----------------------------------------------------------------------#

  /**
   * @return Wraps a string taking into account the width of the
   * terminal and an option indent. Adapted from
   * https://macromates.com/blog/2006/wrapping-text-with-regular-expressions/
   *
   * @param string The string to wrap
   *
   * @param indent The string to use to indent the result.
   *
   * @return The formatted string.
   *
   * @note If CocoaPods is not being run in a terminal or the width of the
   * terminal is too small a width of 80 is assumed.
   */
  private static wrap_string(string: string, indent = 0): string {
    // if disable_wrap
    //   (' ' * indent) + string
    // else
    //   first_space = ' ' * indent
    //   indented = CLAide::Command::Banner::TextWrapper.wrap_with_indent(string, indent, 9999)
    //   first_space + indented
    // end
  }
}

class CoreUI {
  puts(message: string): void {
    UserInterface.puts(message);
  }

  print(message: string): void {
    UserInterface.print(message);
  }

  warn(message: string): void {
    UserInterface.warn(message);
  }
}

// module Xcodeproj
//   # Redirects xcodeproj UI.
//   #
//   module UserInterface
//     def self.puts(message)
//       ::Pod::UI.puts message
//     end

//     def self.warn(message)
//       ::Pod::UI.warn message
//     end
//   end
// end
