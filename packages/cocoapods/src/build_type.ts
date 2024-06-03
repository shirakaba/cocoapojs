// TODO: Remove when this is merged - https://github.com/shirakaba/cocoapojs/pull/10
export interface BuildType {
  static_library(): boolean;

  static_framework(): boolean;

  static(): boolean;

  library(): boolean;

  framework(): boolean;

  dynamic_library(): boolean;

  dynamic_framework(): boolean;

  dynamic(): boolean;
}
