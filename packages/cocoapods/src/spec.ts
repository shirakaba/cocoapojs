// TODO: This file is just for sharing the interface between files in downloader dir
//   Remove when we implemented Specification properly

export interface Specification {
  name: string;
  source?: Record<string, string>;
  version: string;
  checksum?: string;

  available_platforms: string[];

  recursive_subspecs(): Specification[];
}
