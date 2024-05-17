/* eslint-disable @typescript-eslint/no-explicit-any */

// https://github.com/CocoaPods/CocoaPods/blob/master/lib/cocoapods/installer.rb

export class Installer {
  // TODO:
  // include Config::Mixin

  static readonly MASTER_SPECS_REPO_GIT_URL =
    "https://github.com/CocoaPods/Specs.git";

  static {
    Installer.prototype.use_default_plugins = true;
    Installer.prototype.has_dependencies = true;
    Installer.prototype.repo_update = false;
    Installer.prototype.clean_install = false;
  }

  use_default_plugins!: boolean;
  private has_dependencies!: boolean;
  private readonly pod_installers = new Array<any>();

  constructor(
    private readonly sandbox: any,
    private readonly podfile: any,
    private readonly lockfile = null,
  ) {}

  // update: [Record<string, unknown, boolean, null];
  repo_update!: boolean;
  clean_install!: boolean;
  private installation_cache: any;
  private metadata_cache: any;
  private project_cache_version: any;

  install(): void {
    this.prepare();
    this.resolve_dependencies();
    this.download_dependencies();
    this.validate_targets();
    this.clean_sandbox();
    if (this.installation_options.skip_pods_project_generation) {
      this.show_skip_pods_project_generation_message();
      this.run_podfile_post_install_hooks();
    } else {
      this.integrate();
    }
    this.write_lockfiles();
    this.perform_post_install_actions();
  }

  show_skip_pods_project_generation_message(): void {
    // UI.section 'Skipping Pods Project Creation'
    // UI.section 'Skipping User Project Integration'
  }

  integrate(): void {
    this.run_podfile_pre_integrate_hooks();
    this.generate_pods_project();
    if (this.installation_options.integrate_targets) {
      this.integrate_user_project();
    } else {
      // UI.section 'Skipping User Project Integration'
    }
  }

  analyze_project_cache(): void {
    // user_projects = aggregate_targets.map(&:user_project).compact.uniq
    // object_version = user_projects.min_by { |p| p.object_version.to_i }.object_version.to_i unless user_projects.empty?
    // if !installation_options.incremental_installation
    //   # Run entire installation.
    //   ProjectCache::ProjectCacheAnalysisResult.new(pod_targets, aggregate_targets, {},
    //                                                analysis_result.all_user_build_configurations, object_version)
    // else
    //   UI.message 'Analyzing Project Cache' do
    //     @installation_cache = ProjectCache::ProjectInstallationCache.from_file(sandbox, sandbox.project_installation_cache_path)
    //     @metadata_cache = ProjectCache::ProjectMetadataCache.from_file(sandbox, sandbox.project_metadata_cache_path)
    //     @project_cache_version = ProjectCache::ProjectCacheVersion.from_file(sandbox.project_version_cache_path)
    //     force_clean_install = clean_install || project_cache_version.version != Version.create(VersionMetadata.project_cache_version)
    //     cache_result = ProjectCache::ProjectCacheAnalyzer.new(sandbox, installation_cache, analysis_result.all_user_build_configurations,
    //                                                           object_version, plugins, pod_targets, aggregate_targets, installation_options.to_h, :clean_install => force_clean_install).analyze
    //     aggregate_targets_to_generate = cache_result.aggregate_targets_to_generate || []
    //     pod_targets_to_generate = cache_result.pod_targets_to_generate
    //     (aggregate_targets_to_generate + pod_targets_to_generate).each do |target|
    //       UI.message "- Regenerating #{target.label}"
    //     end
    //     cache_result
    //   end
    // end
  }

  prepare(): void {
    // # Raise if pwd is inside Pods
    // if Dir.pwd.start_with?(sandbox.root.to_path)
    //   message = 'Command should be run from a directory outside Pods directory.'
    //   message << "\n\n\tCurrent directory is #{UI.path(Pathname.pwd)}\n"
    //   raise Informative, message
    // end
    // UI.message 'Preparing' do
    //   deintegrate_if_different_major_version
    //   sandbox.prepare
    //   ensure_plugins_are_installed!
    //   run_plugins_pre_install_hooks
    // end
  }

  resolve_dependencies(): any {
    // plugin_sources = run_source_provider_hooks
    // analyzer = create_analyzer(plugin_sources)
    // UI.section 'Updating local specs repositories' do
    //   analyzer.update_repositories
    // end if repo_update?
    // UI.section 'Analyzing dependencies' do
    //   analyze(analyzer)
    //   validate_build_configurations
    // end
    // UI.section 'Verifying no changes' do
    //   verify_no_podfile_changes!
    //   verify_no_lockfile_changes!
    // end if deployment?
    // analyzer
  }

  download_depdendencies() {
    // UI.section 'Downloading dependencies' do
    //   install_pod_sources
    //   run_podfile_pre_install_hooks
    //   clean_pod_sources
    // end
  }

  stage_sandbox(sandbox: any, pod_targets: Array<any>): void {
    // SandboxHeaderPathsInstaller.new(sandbox, pod_targets).install!
  }

  private create_generator(
    pod_targets_to_generate: any,
    aggregate_targets_to_generate: any,
    build_configurations: any,
    project_object_version: any,
    generate_multiple_pod_projects = false,
  ): void {
    // if generate_multiple_pod_projects
    //   Xcode::MultiPodsProjectGenerator.new(sandbox, aggregate_targets_to_generate, pod_targets_to_generate,
    //                                         build_configurations, installation_options, config, project_object_version, metadata_cache)
    // else
    //   Xcode::SinglePodsProjectGenerator.new(sandbox, aggregate_targets_to_generate, pod_targets_to_generate, build_configurations, installation_options, config, project_object_version)
    // end
  }

  private get installation_options(): any {
    return this.podfile.installation_options;
  }

  /**
   * Generates the Xcode project(s) that go inside the `Pods/` directory.
   */
  private generate_pods_project(): void {
    // stage_sandbox(sandbox, pod_targets)
    // cache_analysis_result = analyze_project_cache
    // pod_targets_to_generate = cache_analysis_result.pod_targets_to_generate
    // aggregate_targets_to_generate = cache_analysis_result.aggregate_targets_to_generate
    // pod_targets_to_generate.each do |pod_target|
    //   pod_target.build_headers.implode_path!(pod_target.headers_sandbox)
    //   sandbox.public_headers.implode_path!(pod_target.headers_sandbox)
    // end
    // create_and_save_projects(pod_targets_to_generate, aggregate_targets_to_generate,
    //                          cache_analysis_result.build_configurations, cache_analysis_result.project_object_version)
    // SandboxDirCleaner.new(sandbox, pod_targets, aggregate_targets).clean!
    // update_project_cache(cache_analysis_result, target_installation_results)
  }

  private create_and_save_projects(
    pod_targets_to_generate,
    aggregate_targets_to_generate,
    build_configurations,
    project_object_version,
  ): void {
    // UI.section 'Generating Pods project' do
    //   generator = create_generator(pod_targets_to_generate, aggregate_targets_to_generate,
    //                                build_configurations, project_object_version,
    //                                installation_options.generate_multiple_pod_projects)
    //   pod_project_generation_result = generator.generate!
    //   @target_installation_results = pod_project_generation_result.target_installation_results
    //   @pods_project = pod_project_generation_result.project
    //   # The `pod_target_subprojects` is used for backwards compatibility so that consumers can iterate over
    //   # all pod targets across projects without needing to open each one.
    //   @pod_target_subprojects = pod_project_generation_result.projects_by_pod_targets.keys
    //   @generated_projects = ([pods_project] + pod_target_subprojects || []).compact
    //   @generated_pod_targets = pod_targets_to_generate
    //   @generated_aggregate_targets = aggregate_targets_to_generate || []
    //   projects_by_pod_targets = pod_project_generation_result.projects_by_pod_targets
    //   predictabilize_uuids(generated_projects) if installation_options.deterministic_uuids?
    //   stabilize_target_uuids(generated_projects)
    //   projects_writer = Xcode::PodsProjectWriter.new(sandbox, generated_projects,
    //                                                  target_installation_results.pod_target_installation_results, installation_options)
    //   projects_writer.write! do
    //     run_podfile_post_install_hooks
    //   end
    //   pods_project_pod_targets = pod_targets_to_generate - projects_by_pod_targets.values.flatten
    //   all_projects_by_pod_targets = {}
    //   pods_project_by_targets = { pods_project => pods_project_pod_targets } if pods_project
    //   all_projects_by_pod_targets.merge!(pods_project_by_targets) if pods_project_by_targets
    //   all_projects_by_pod_targets.merge!(projects_by_pod_targets) if projects_by_pod_targets
    //   all_projects_by_pod_targets.each do |project, pod_targets|
    //     generator.configure_schemes(project, pod_targets, pod_project_generation_result)
    //   end
    // end
  }

  private predictabilize_uuids(projects): void {
    // UI.message('- Generating deterministic UUIDs') { Xcodeproj::Project.predictabilize_uuids(projects) }
  }

  private stabilize_target_uuids(projects): void {
    // UI.message('- Stabilizing target UUIDs') { TargetUUIDGenerator.new(projects).generate! }
  }

  // #-------------------------------------------------------------------------#

  // public

  // # @!group Installation results

  // # @return [Analyzer::AnalysisResult] the result of the analysis performed during installation
  // #
  #analysis_result: any;
  get analysis_result(): any {
    return this.#analysis_result;
  }

  // # @return [Array<Hash{String, TargetInstallationResult}>] the installation results produced by the pods project
  // #         generator
  // #
  #target_installation_results: any;
  get target_installation_results(): any {
    return this.#target_installation_results;
  }

  // # @return [Pod::Project] the `Pods/Pods.xcodeproj` project.
  // #
  #pods_project: any;
  get pods_project(): any {
    return this.#pods_project;
  }

  // # @return [Array<Pod::Project>] the subprojects nested under pods_project.
  // #
  #pod_target_subprojects?: Array<any>;
  get pod_target_subprojects(): Array<any> {
    return this.#pod_target_subprojects ?? [];
  }

  // # @return [Array<AggregateTarget>] The model representations of an
  // #         aggregation of pod targets generated for a target definition
  // #         in the Podfile as result of the analyzer.
  // #
  #aggregate_targets?: Array<any>;
  get aggregate_targets(): Array<any> {
    return this.#aggregate_targets ?? [];
  }

  // # @return [Array<PodTarget>] The model representations of pod targets
  // #         generated as result of the analyzer.
  // #
  #pod_targets?: Array<any>;
  get pod_targets(): Array<any> {
    return this.#pod_targets ?? [];
  }

  // # @return [Array<Project>] The list of projects generated from the installation.
  // #
  #generated_projects?: Array<any>;
  get generated_projects(): Array<any> {
    return this.#generated_projects ?? [];
  }

  // # @return [Array<PodTarget>] The list of pod targets that were generated from the installation.
  // #
  #generated_pod_targets?: Array<any>;
  get generated_pod_targets(): Array<any> {
    return this.#generated_pod_targets ?? [];
  }

  // # @return [Array<AggregateTarget>] The list of aggregate targets that were generated from the installation.
  // #
  #generated_aggregate_targets?: Array<any>;
  get generated_aggregate_targets(): Array<any> {
    return this.#generated_aggregate_targets ?? [];
  }

  // # @return [Array<Specification>] The specifications that were installed.
  // #
  #installed_specs?: Array<any>;
  get installed_specs(): Array<any> {
    return this.#installed_specs ?? [];
  }

  // #-------------------------------------------------------------------------#

  // private

  // # @!group Installation steps

  // # Performs the analysis.
  // #
  // # @param  [Analyzer] analyzer the analyzer to use for analysis
  // #
  // # @return [void]
  // #
  private analyze(analyzer = this.create_analyzer()): void {
    this.analysis_result = analyzer.analyze;
    this.aggregate_targets = this.analysis_result.targets;
    this.pod_targets = this.analysis_result.pod_targets;
  }

  private create_analyzer(plugin_sources?: any): any {
    // return Analyzer.new(sandbox, podfile, lockfile, plugin_sources, has_dependencies?, update)
  }

  // # Ensures that the white-listed build configurations are known to prevent
  // # silent typos.
  // #
  // # @raise  If an unknown user configuration is found.
  // #
  private validate_build_configurations(): void {
    // whitelisted_configs = pod_targets.
    //   flat_map(&:target_definitions).
    //   flat_map(&:all_whitelisted_configurations).
    //   map(&:downcase).
    //   uniq
    // all_user_configurations = analysis_result.all_user_build_configurations.keys.map(&:downcase)
    // remainder = whitelisted_configs - all_user_configurations
    // unless remainder.empty?
    //   raise Informative,
    //         "Unknown #{'configuration'.pluralize(remainder.size)} whitelisted: #{remainder.sort.to_sentence}. " \
    //         "CocoaPods found #{all_user_configurations.sort.to_sentence}, did you mean one of these?"
    // end
  }

  // # @return [void] Performs a general clean up of the sandbox related to the sandbox state that was
  // #                calculated. For example, pods that were marked for deletion are removed.
  // #
  private clean_sandbox(): void {
    // unless sandbox_state.deleted.empty?
    //   title_options = { :verbose_prefix => '-> '.red }
    //   sandbox_state.deleted.each do |pod_name|
    //     UI.titled_section("Removing #{pod_name}".red, title_options) do
    //       root_name = Specification.root_name(pod_name)
    //       pod_dir = sandbox.local?(root_name) ? nil : sandbox.pod_dir(root_name)
    //       sandbox.clean_pod(pod_name, pod_dir)
    //     end
    //   end
    // end
    // # Check any changed pods that became local pods and used to be remote pods and
    // # ensure the sandbox is cleaned up.
    // unless sandbox_state.changed.empty?
    //   sandbox_state.changed.each do |pod_name|
    //     previous_spec_repo = sandbox.manifest.spec_repo(pod_name)
    //     should_clean = !previous_spec_repo.nil? && sandbox.local?(pod_name)
    //     sandbox.clean_pod(pod_name, sandbox.sources_root + Specification.root_name(pod_name)) if should_clean
    //   end
    // end
  }

  // # @raise [Informative] If there are any Podfile changes
  // #
  private verify_no_podfile_changes(): void {
    // return unless analysis_result.podfile_needs_install?
    // changed_state = analysis_result.podfile_state.to_s(:states => %i(added deleted changed))
    // raise Informative, "There were changes to the podfile in deployment mode:\n#{changed_state}"
  }

  // # @raise [Informative] If there are any Lockfile changes
  // #
  private verify_no_lockfile_changes(): void {
    // new_lockfile = generate_lockfile
    // return if new_lockfile == lockfile
    // return unless diff = Xcodeproj::Differ.hash_diff(lockfile.to_hash, new_lockfile.to_hash, :key_1 => 'Old Lockfile', :key_2 => 'New Lockfile')
    // pretty_diff = YAMLHelper.convert_hash(diff, Lockfile::HASH_KEY_ORDER, "\n\n")
    // pretty_diff.gsub!(':diff:', 'diff:'.yellow)
    // raise Informative, "There were changes to the lockfile in deployment mode:\n#{pretty_diff}"
  }

  // # Downloads, installs the documentation and cleans the sources of the Pods
  // # which need to be installed.
  // #
  // # @return [void]
  // #
  private install_pod_sources(): void {
    // @downloaded_specs = []
    // @installed_specs = []
    // pods_to_install = sandbox_state.added | sandbox_state.changed
    // title_options = { :verbose_prefix => '-> '.green }
    // sorted_root_specs = root_specs.sort_by(&:name)
    // # Download pods in parallel before installing if the option is set
    // if installation_options.parallel_pod_downloads
    //   require 'concurrent/executor/fixed_thread_pool'
    //   thread_pool_size = installation_options.parallel_pod_download_thread_pool_size
    //   thread_pool = Concurrent::FixedThreadPool.new(thread_pool_size, :idletime => 300)
    //   sorted_root_specs.each do |spec|
    //     if pods_to_install.include?(spec.name)
    //       title = section_title(spec, 'Downloading')
    //       UI.titled_section(title.green, title_options) do
    //         thread_pool.post do
    //           download_source_of_pod(spec.name)
    //         end
    //       end
    //     end
    //   end
    //   thread_pool.shutdown
    //   thread_pool.wait_for_termination
    // end
    // # Install pods, which includes downloading only if parallel_pod_downloads is set to false
    // sorted_root_specs.each do |spec|
    //   if pods_to_install.include?(spec.name)
    //     title = section_title(spec, 'Installing')
    //     UI.titled_section(title.green, title_options) do
    //       install_source_of_pod(spec.name)
    //     end
    //   else
    //     UI.section("Using #{spec}", title_options[:verbose_prefix]) do
    //       create_pod_installer(spec.name)
    //     end
    //   end
    // end
  }

  private section_title(spec, current_action): any {
    // if sandbox_state.changed.include?(spec.name) && sandbox.manifest
    //   current_version = spec.version
    //   previous_version = sandbox.manifest.version(spec.name)
    //   has_changed_version = current_version != previous_version
    //   current_repo = analysis_result.specs_by_source.detect { |key, values| break key if values.map(&:name).include?(spec.name) }
    //   current_repo &&= (Pod::TrunkSource::TRUNK_REPO_NAME if current_repo.name == Pod::TrunkSource::TRUNK_REPO_NAME) || current_repo.url || current_repo.name
    //   previous_spec_repo = sandbox.manifest.spec_repo(spec.name)
    //   has_changed_repo = !previous_spec_repo.nil? && current_repo && !current_repo.casecmp(previous_spec_repo).zero?
    //   title = "#{current_action} #{spec.name} #{spec.version}"
    //   title << " (was #{previous_version} and source changed to `#{current_repo}` from `#{previous_spec_repo}`)" if has_changed_version && has_changed_repo
    //   title << " (was #{previous_version})" if has_changed_version && !has_changed_repo
    //   title << " (source changed to `#{current_repo}` from `#{previous_spec_repo}`)" if !has_changed_version && has_changed_repo
    // else
    //   title = "#{current_action} #{spec}"
    // end
    // title
  }

  private create_pod_installer(pod_name): any {
    // specs_by_platform = specs_for_pod(pod_name)
    // if specs_by_platform.empty?
    //   requiring_targets = pod_targets.select { |pt| pt.recursive_dependent_targets.any? { |dt| dt.pod_name == pod_name } }
    //   message = "Could not install '#{pod_name}' pod"
    //   message += ", depended upon by #{requiring_targets.to_sentence}" unless requiring_targets.empty?
    //   message += '. There is either no platform to build for, or no target to build.'
    //   raise StandardError, message
    // end
    // pod_installer = PodSourceInstaller.new(sandbox, podfile, specs_by_platform, :can_cache => installation_options.clean?)
    // pod_installers << pod_installer
    // pod_installer
  }

  private create_pod_downloader(pod_name): any {
    // specs_by_platform = specs_for_pod(pod_name)
    // if specs_by_platform.empty?
    //   requiring_targets = pod_targets.select { |pt| pt.recursive_dependent_targets.any? { |dt| dt.pod_name == pod_name } }
    //   message = "Could not download '#{pod_name}' pod"
    //   message += ", depended upon by #{requiring_targets.to_sentence}" unless requiring_targets.empty?
    //   message += '. There is either no platform to build for, or no target to build.'
    //   raise StandardError, message
    // end
    // PodSourceDownloader.new(sandbox, podfile, specs_by_platform, :can_cache => installation_options.clean?)
  }

  // # The specifications matching the specified pod name
  // #
  // # @param  [String] pod_name the name of the pod
  // #
  // # @return [Hash{Platform => Array<Specification>}] the specifications grouped by platform
  // #
  private specs_for_pod(pod_name): any {
    // pod_targets.each_with_object({}) do |pod_target, hash|
    //   if pod_target.root_spec.name == pod_name
    //     hash[pod_target.platform] ||= []
    //     hash[pod_target.platform].concat(pod_target.specs)
    //   end
    // end
  }

  // # Install the Pods. If the resolver indicated that a Pod should be
  // # installed and it exits, it is removed and then reinstalled. In any case if
  // # the Pod doesn't exits it is installed.
  // #
  // # @return [void]
  // #
  install_source_of_pod(pod_name): void {
    // pod_installer = create_pod_installer(pod_name)
    // pod_installer.install!
    // @installed_specs.concat(pod_installer.specs_by_platform.values.flatten.uniq)
  }

  // # Download the pod unless it is local or has been predownloaded from an
  // # external source.
  // #
  // # @return [void]
  // #
  private download_source_of_pod(pod_name): void {
    // return if sandbox.local?(pod_name) || sandbox.predownloaded?(pod_name)
    // pod_downloader = create_pod_downloader(pod_name)
    // pod_downloader.download!
  }

  // # Cleans the sources of the Pods if the config instructs to do so.
  // #
  private clean_pod_sources(): void {
    // return unless installation_options.clean?
    // return if installed_specs.empty?
    // pod_installers.each(&:clean!)
  }

  // # Unlocks the sources of the Pods.
  // #
  private unlock_pod_sources(): void {
    // pod_installers.each do |installer|
    //   pod_target = pod_targets.find { |target| target.pod_name == installer.name }
    //   installer.unlock_files!(pod_target.file_accessors)
    // end
  }

  // # Locks the sources of the Pods if the config instructs to do so.
  // #
  private lock_pod_sources(): void {
    // return unless installation_options.lock_pod_sources?
    // pod_installers.each do |installer|
    //   pod_target = pod_targets.find { |target| target.pod_name == installer.name }
    //   installer.lock_files!(pod_target.file_accessors)
    // end
  }

  private validate_targets(): void {
    // validator = Xcode::TargetValidator.new(aggregate_targets, pod_targets, installation_options)
    // validator.validate!
  }

  // # Runs the registered callbacks for the plugins pre install hooks.
  // #
  // # @return [void]
  // #
  private run_plugins_pre_install_hooks(): void {
    // context = PreInstallHooksContext.generate(sandbox, podfile, lockfile)
    // HooksManager.run(:pre_install, context, plugins)
  }

  // # Performs any post-installation actions
  // #
  // # @return [void]
  // #
  private perform_post_install_actions(): void {
    this.run_plugins_post_install_hooks();
    this.warn_for_deprecations();
    this.warn_for_installed_script_phases();
    this.warn_for_removing_git_master_specs_repo();
    this.print_post_install_message();
  }

  private print_post_install_message(): void {
    // podfile_dependencies = analysis_result.podfile_dependency_cache.podfile_dependencies.size
    // pods_installed = root_specs.size
    // title_options = { :verbose_prefix => '-> '.green }
    // UI.titled_section('Pod installation complete! ' \
    //                   "There #{podfile_dependencies == 1 ? 'is' : 'are'} #{podfile_dependencies} " \
    //                   "#{'dependency'.pluralize(podfile_dependencies)} from the Podfile " \
    //                   "and #{pods_installed} total #{'pod'.pluralize(pods_installed)} installed.".green,
    //                   title_options)
  }

  // # Runs the registered callbacks for the plugins pre integrate hooks.
  // #
  private run_plugins_pre_integrate_hooks(): void {
    // if any_plugin_pre_integrate_hooks?
    //   context = PreIntegrateHooksContext.generate(sandbox, pods_project, pod_target_subprojects, aggregate_targets)
    //   HooksManager.run(:pre_integrate, context, plugins)
    // end
  }

  // # Runs the registered callbacks for the plugins post install hooks.
  // #
  private run_plugins_post_install_hooks(): void {
    // # This short-circuits because unlocking pod sources is expensive
    // if any_plugin_post_install_hooks?
    //   unlock_pod_sources
    //   context = PostInstallHooksContext.generate(sandbox, pods_project, pod_target_subprojects, aggregate_targets)
    //   HooksManager.run(:post_install, context, plugins)
    // end
    // lock_pod_sources
  }

  // # Runs the registered callbacks for the plugins post integrate hooks.
  // #
  private run_plugins_post_integrate_hooks(): void {
    // if any_plugin_post_integrate_hooks?
    //   context = PostIntegrateHooksContext.generate(sandbox, pods_project, pod_target_subprojects, aggregate_targets)
    //   HooksManager.run(:post_integrate, context, plugins)
    // end
  }

  // # @return [Boolean] whether there are any plugin pre-integrate hooks to run
  // #
  private any_plugin_pre_integrate_hooks(): boolean {
    // HooksManager.hooks_to_run(:pre_integrate, plugins).any?
  }

  // # @return [Boolean] whether there are any plugin post-install hooks to run
  // #
  private any_plugin_post_install_hooks(): boolean {
    // HooksManager.hooks_to_run(:post_install, plugins).any?
  }

  // # @return [Boolean] whether there are any plugin post-integrate hooks to run
  // #
  private any_plugin_post_integrate_hooks(): boolean {
    // HooksManager.hooks_to_run(:post_integrate, plugins).any?
  }

  // # Runs the registered callbacks for the source provider plugin hooks.
  // #
  // # @return [Array<Pod::Source>] the plugin sources
  // #
  private run_source_provider_hooks(): Array<any> {
    // context = SourceProviderHooksContext.generate
    // HooksManager.run(:source_provider, context, plugins)
    // context.sources
  }

  // # Run the deintegrator against all projects in the installation root if the
  // # current CocoaPods major version part is different than the one in the
  // # lockfile.
  // #
  // # @return [void]
  // #
  private deintegrate_if_different_major_version(): void {
    // return unless lockfile
    // return if lockfile.cocoapods_version.major == Version.create(VERSION).major
    // UI.section('Re-creating CocoaPods due to major version update.') do
    //   projects = Pathname.glob(config.installation_root + '*.xcodeproj').map { |path| Xcodeproj::Project.open(path) }
    //   deintegrator = Deintegrator.new
    //   projects.each do |project|
    //     config.with_changes(:silent => true) { deintegrator.deintegrate_project(project) }
    //     project.save if project.dirty?
    //   end
    // end
  }

  // # Ensures that all plugins specified in the {#podfile} are loaded.
  // #
  // # @return [void]
  // #
  private ensure_plugins_are_installed(): void {
    // require 'claide/command/plugin_manager'
    // loaded_plugins = Command::PluginManager.specifications.map(&:name)
    // podfile.plugins.keys.each do |plugin|
    //   unless loaded_plugins.include? plugin
    //     raise Informative, "Your Podfile requires that the plugin `#{plugin}` be installed. Please install it and try installation again."
    //   end
    // end
  }

  private DEFAULT_PLUGINS: Record<string, Record<string, any>> = {};

  // # Returns the plugins that should be run, as indicated by the default
  // # plugins and the podfile's plugins
  // #
  // # @return [Hash<String, Hash>] The plugins to be used
  // #
  private plugins(): Record<string, Record<string, any>> {
    // if use_default_plugins?
    //   DEFAULT_PLUGINS.merge(podfile.plugins)
    // else
    //   podfile.plugins
    // end
  }

  // # Prints a warning for any pods that are deprecated
  // #
  // # @return [void]
  // #
  private warn_for_deprecations(): void {
    // deprecated_pods = root_specs.select do |spec|
    //   spec.deprecated || spec.deprecated_in_favor_of
    // end
    // deprecated_pods.each do |spec|
    //   if spec.deprecated_in_favor_of
    //     UI.warn "#{spec.name} has been deprecated in " \
    //       "favor of #{spec.deprecated_in_favor_of}"
    //   else
    //     UI.warn "#{spec.name} has been deprecated"
    //   end
    // end
  }

  // # Prints a warning for any pods that included script phases
  // #
  // # @return [void]
  // #
  private warn_for_installed_script_phases(): void {
    // pods_to_install = sandbox_state.added | sandbox_state.changed
    // pod_targets.group_by(&:pod_name).each do |name, pod_targets|
    //   if pods_to_install.include?(name) && !sandbox.local?(name)
    //     script_phase_count = pod_targets.inject(0) { |sum, target| sum + target.script_phases.count }
    //     unless script_phase_count.zero?
    //       UI.warn "#{name} has added #{script_phase_count} #{'script phase'.pluralize(script_phase_count)}. " \
    //         'Please inspect before executing a build. See `https://guides.cocoapods.org/syntax/podspec.html#script_phases` for more information.'
    //     end
    //   end
    // end
  }

  // # Prints a warning if the project is not explicitly using the git based master specs repo.
  // #
  // # Helps users to delete the git based master specs repo from the repos directory which reduces `--repo-update`
  // # speed and hopefully reduces Github workload.
  // #
  // # @return [void]
  // #
  private warn_for_removing_git_master_specs_repo(): void {
    // return unless installation_options.warn_for_unused_master_specs_repo?
    // plugin_sources = run_source_provider_hooks
    // all_sources = podfile.sources + plugin_sources.map(&:url)
    // master_source = all_sources.find { |source| source == MASTER_SPECS_REPO_GIT_URL }
    // master_repo = config.sources_manager.all.find { |s| s.url == MASTER_SPECS_REPO_GIT_URL }
    // if master_source.nil? && !master_repo.nil?
    //   UI.warn 'Your project does not explicitly specify the CocoaPods master specs repo. Since CDN is now used as the' \
    //   ' default, you may safely remove it from your repos directory via `pod repo remove master`. To suppress this warning' \
    //   ' please add `warn_for_unused_master_specs_repo => false` to your Podfile.'
    // end
  }

  // # @return [Lockfile] The lockfile to write to disk.
  // #
  private generate_lockfile(): any {
    // external_source_pods = analysis_result.podfile_dependency_cache.podfile_dependencies.select(&:external_source).map(&:root_name).uniq
    // checkout_options = sandbox.checkout_sources.select { |root_name, _| external_source_pods.include? root_name }
    // Lockfile.generate(podfile, analysis_result.specifications, checkout_options, analysis_result.specs_by_source)
  }

  // # Writes the Podfile and the lock files.
  // #
  // # @return [void]
  // #
  private write_lockfiles(): void {
    // @lockfile = generate_lockfile
    // UI.message "- Writing Lockfile in #{UI.path config.lockfile_path}" do
    //   # No need to invoke Sandbox#update_changed_file here since this logic already handles checking if the
    //   # contents of the file are the same.
    //   @lockfile.write_to_disk(config.lockfile_path)
    // end
    // UI.message "- Writing Manifest in #{UI.path sandbox.manifest_path}" do
    //   # No need to invoke Sandbox#update_changed_file here since this logic already handles checking if the
    //   # contents of the file are the same.
    //   @lockfile.write_to_disk(sandbox.manifest_path)
    // end
  }

  // # @param [ProjectCacheAnalysisResult] cache_analysis_result
  // #        The cache analysis result for the current installation.
  // #
  // # @param [Hash{String => TargetInstallationResult}] target_installation_results
  // #        The installation results for pod targets installed.
  // #
  private update_project_cache(
    cache_analysis_result: any,
    target_installation_results: Record<string, any>,
  ): void {
    // return unless installation_cache || metadata_cache
    // installation_cache.update_cache_key_by_target_label!(cache_analysis_result.cache_key_by_target_label)
    // installation_cache.update_project_object_version!(cache_analysis_result.project_object_version)
    // installation_cache.update_build_configurations!(cache_analysis_result.build_configurations)
    // installation_cache.update_podfile_plugins!(plugins)
    // installation_cache.update_installation_options!(installation_options.to_h)
    // installation_cache.save_as(sandbox.project_installation_cache_path)
    // metadata_cache.update_metadata!(target_installation_results.pod_target_installation_results || {},
    //                                 target_installation_results.aggregate_target_installation_results || {})
    // metadata_cache.save_as(sandbox.project_metadata_cache_path)
    // cache_version = ProjectCache::ProjectCacheVersion.new(VersionMetadata.project_cache_version)
    // cache_version.save_as(sandbox.project_version_cache_path)
  }

  // # Integrates the user projects adding the dependencies on the CocoaPods
  // # libraries, setting them up to use the xcconfigs and performing other
  // # actions. This step is also responsible of creating the workspace if
  // # needed.
  // #
  // # @return [void]
  // #
  private integrate_user_project(): void {
    // UI.section "Integrating client #{'project'.pluralize(aggregate_targets.map(&:user_project_path).uniq.count)}" do
    //   installation_root = config.installation_root
    //   integrator = UserProjectIntegrator.new(podfile, sandbox, installation_root, aggregate_targets, generated_aggregate_targets,
    //                                          :use_input_output_paths => !installation_options.disable_input_output_paths?)
    //   integrator.integrate!
    //   run_podfile_post_integrate_hooks
    // end
  }

  // #-------------------------------------------------------------------------#

  // private

  // # @!group Hooks

  // # Runs the pre install hooks of the installed specs and of the Podfile.
  // #
  // # @return [void]
  // #
  private run_podfile_pre_install_hooks(): void {
    // UI.message '- Running pre install hooks' do
    //   executed = run_podfile_pre_install_hook
    //   UI.message '- Podfile' if executed
    // end
  }

  // # Runs the pre install hook of the Podfile
  // #
  // # @raise  Raises an informative if the hooks raises.
  // #
  // # @return [Boolean] Whether the hook was run.
  // #
  private run_podfile_pre_install_hook(): boolean {
    //   podfile.pre_install!(self)
    // rescue => e
    //   raise Informative, 'An error occurred while processing the pre-install ' \
    //     'hook of the Podfile.' \
    //     "\n\n#{e.message}\n\n#{e.backtrace * "\n"}"
  }

  // # Runs the pre integrate hooks of the installed specs and of the Podfile.
  // #
  // # @note   Pre integrate hooks run _before_ generation of the Pods project.
  // #
  // # @return [void]
  // #
  private run_podfile_pre_integrate_hooks(): void {
    // UI.message '- Running pre integrate hooks' do
    //   executed = run_podfile_pre_integrate_hook
    //   UI.message '- Podfile' if executed
    // end
  }

  // # Runs the pre integrate hook of the Podfile.
  // #
  // # @raise  Raises an informative if the hooks raises.
  // #
  // # @return [Boolean] Whether the hook was run.
  // #
  private run_podfile_pre_integrate_hook(): boolean {
    //   podfile.pre_integrate!(self)
    // rescue => e
    //   raise Informative, 'An error occurred while processing the pre-integrate ' \
    //     'hook of the Podfile.' \
    //     "\n\n#{e.message}\n\n#{e.backtrace * "\n"}"
  }

  // # Runs the post install hooks of the installed specs and of the Podfile.
  // #
  // # @note   Post install hooks run _before_ saving of project, so that they
  // #         can alter it before it is written to the disk.
  // #
  // # @return [void]
  // #
  private run_podfile_post_install_hooks(): void {
    // UI.message '- Running post install hooks' do
    //   executed = run_podfile_post_install_hook
    //   UI.message '- Podfile' if executed
    // end
  }

  // # Runs the post install hook of the Podfile
  // #
  // # @raise  Raises an informative if the hooks raises.
  // #
  // # @return [Boolean] Whether the hook was run.
  // #
  private run_podfile_post_install_hook(): boolean {
    //   podfile.post_install!(self)
    // rescue => e
    //   raise Informative, 'An error occurred while processing the post-install ' \
    //     'hook of the Podfile.' \
    //     "\n\n#{e.message}\n\n#{e.backtrace * "\n"}"
  }

  // # Runs the post integrate hooks of the installed specs and of the Podfile.
  // #
  // # @note   Post integrate hooks run _after_ saving of project, so that they
  // #         can alter it after it is written to the disk.
  // #
  // # @return [void]
  // #
  private run_podfile_post_integrate_hooks(): void {
    // UI.message '- Running post integrate hooks' do
    //   executed = run_podfile_post_integrate_hook
    //   UI.message '- Podfile' if executed
    // end
  }

  // # Runs the post integrate hook of the Podfile.
  // #
  // # @raise  Raises an informative if the hooks raises.
  // #
  // # @return [Boolean] Whether the hook was run.
  // #
  private run_podfile_post_integrate_hook(): boolean {
    //   podfile.post_integrate!(self)
    // rescue => e
    //   raise Informative, 'An error occurred while processing the post-integrate ' \
    //     'hook of the Podfile.' \
    //     "\n\n#{e.message}\n\n#{e.backtrace * "\n"}"
  }
  // #-------------------------------------------------------------------------#

  // public

  // # @param [Array<PodTarget>] targets
  // #
  // # @return [Array<PodTarget>] The targets of the development pods generated by
  // #         the installation process. This can be used as a convenience method for external scripts.
  // #
  development_pod_targets(targets = pod_targets): Array<any> {
    // targets.select do |pod_target|
    //   sandbox.local?(pod_target.pod_name)
    // end
  }

  // #-------------------------------------------------------------------------#

  // private

  // # @!group Private helpers

  // # @return [Array<Specification>] All the root specifications of the
  // #         installation.
  // #
  private root_specs(): Array<any> {
    // analysis_result.specifications.map(&:root).uniq
  }

  // # @return [SpecsState] The state of the sandbox returned by the analyzer.
  // #
  private sandbox_state(): any {
    // analysis_result.sandbox_state
  }

  // # @return [InstallationOptions] the installation options to use during install
  // #
  private installation_options(): any {
    // podfile.installation_options
  }

  // #-------------------------------------------------------------------------#

  // public

  // # @!group Convenience Methods

  static targets_from_sandbox(sandbox, podfile, lockfile): void {
    // raise Informative, 'You must run `pod install` to be able to generate target information' unless lockfile
    // new(sandbox, podfile, lockfile).instance_exec do
    //   plugin_sources = run_source_provider_hooks
    //   analyzer = create_analyzer(plugin_sources)
    //   analyze(analyzer)
    //   if analysis_result.podfile_needs_install?
    //     raise Pod::Informative, 'The Podfile has changed, you must run `pod install`'
    //   elsif analysis_result.sandbox_needs_install?
    //     raise Pod::Informative, 'The `Pods` directory is out-of-date, you must run `pod install`'
    //   end
    //   aggregate_targets
    // end
  }
}
