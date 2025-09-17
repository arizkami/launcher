/**
 * Originally based on:
 * https://gist.github.com/Karylrz/88e65a22c32b99430a8aa2cad70ec266
 *
 * New API link (for v2.2 and up) was taken from:
 * https://github.com/yuhkix/wuwa-downloader
 *
 * It is recommended to use other actively maintained Wuthering Waves downloaders for faster update incase of new API change.
 */

import { writeFileSync } from 'fs';
import { gunzipSync } from 'zlib';
import { selectVersion } from './gist';

// [Options]
/**
 * Release Channel
 * Options:
 * - "default"
 * - "predownload"
 */
const RELEASE_CH = "default";

/**
 * Resource CDN
 * Options:
 * 0: QCloud
 * 1: AWS
 * 2: Akamai
 * 3: CloudFlare
 * 4: Huoshan
 */
const RESOURCE_CDN = 1;

/**
 * MD5 Hash File
 * Create MD5 file for hash checking (using OpenHashTab, 7-Zip etc.).
 */
const MD5_FILE_CREATE = true;

/**
 * WuWa_Files: Wuthering Waves' files that need to be checked for their MD5 hashes.
 * - md5_file_full_path = true:
 *   Put md5 file in "Wuthering Waves Game" folder and WuWa_Files need to be in correct paths inside the folder.
 * - md5_file_full_path = false:
 *   WuWa_Files need to be in the same folder as md5 file.
 */
const MD5_FILE_FULL_PATH = false;

/**
 * Output Files Configuration
 */
const OUTPUT_CONFIG = {
  /**
   * Only insert "big" pak files inside output files (urls and hashes).
   */
  BIGPAKS_ONLY: false,
  
  /**
   * Minimum size of pak file (in bytes) to be considered as "big".
   */
  BIGPAKS_MIN_SIZE: 100000000,
  
  /**
   * Include all file types in output
   */
  INCLUDE_ALL_FILES: true,
  
  /**
   * File extensions to include (when not including all files)
   */
  INCLUDE_EXTENSIONS: ['.pak', '.pck', '.exe', '.dll', '.json','.png', '.sig', '.txt','.ttf','.otf', '.wav'],
  
  /**
   * Minimum file size to include (in bytes)
   */
  MIN_FILE_SIZE: 1024 // 1KB minimum
};

// [Global Variables]
let wuwaVersion = "";

interface IndexResponse {
  [key: string]: {
    version: string;
    resources: string;
    resourcesBasePath: string;
    cdnList: Array<{
      url: string;
    }>;
  };
}

interface ResourceItem {
  dest: string;
  size: number;
  md5: string;
}

interface ResourceResponse {
  resource: ResourceItem[];
}

async function getResponse(url: string): Promise<string> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  let data = await response.arrayBuffer();
  const buffer = new Uint8Array(data);
  
  // Check if response is gzipped by examining the magic number (first two bytes)
  const isGzipped = buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  
  if (isGzipped) {
    try {
      const decompressed = gunzipSync(buffer);
      return new TextDecoder().decode(decompressed);
    } catch (error) {
      console.warn('Failed to decompress gzipped content, trying as plain text');
      return new TextDecoder().decode(buffer);
    }
  }
  
  return new TextDecoder().decode(buffer);
}

function getName(suffix: string): string {
  const prefix = `wuwa_${wuwaVersion}_`;
  let infix = "";
  if (OUTPUT_CONFIG.BIGPAKS_ONLY) {
    infix += "bigpaks_";
  }
  if (!OUTPUT_CONFIG.INCLUDE_ALL_FILES) {
    infix += "filtered_";
  }
  return `${prefix}${infix}${suffix}`;
}

function shouldIncludeFile(resource: ResourceItem): boolean {
  // If including all files, check minimum size
  if (OUTPUT_CONFIG.INCLUDE_ALL_FILES) {
    return resource.size >= OUTPUT_CONFIG.MIN_FILE_SIZE;
  }
  
  // If only big paks, check pak extension and size
  if (OUTPUT_CONFIG.BIGPAKS_ONLY) {
    const extension = '.' + resource.dest.split('.').pop()?.toLowerCase();
    return extension === '.pak' && resource.size >= OUTPUT_CONFIG.BIGPAKS_MIN_SIZE;
  }
  
  // Check if file extension is in the include list
  const extension = '.' + resource.dest.split('.').pop()?.toLowerCase();
  return OUTPUT_CONFIG.INCLUDE_EXTENSIONS.includes(extension) && 
         resource.size >= OUTPUT_CONFIG.MIN_FILE_SIZE;
}

async function main(): Promise<void> {
  try {
    // Select version interactively
    console.log("Selecting Wuthering Waves version...");
    const INDEX_API = await selectVersion();
    
    console.log("Fetching index data...");
    const indexData = await getResponse(INDEX_API);
    const indexJson: IndexResponse = JSON.parse(indexData);
    
    wuwaVersion = indexJson[RELEASE_CH]?.version ?? '';
    console.log(`Wuthering Waves version: ${wuwaVersion}`);
    
    const resourceDomain = indexJson[RELEASE_CH]?.cdnList[RESOURCE_CDN]?.url;
    const resourceApi = resourceDomain + (indexJson[RELEASE_CH]?.resources ?? '');
    const resourceBase = resourceDomain + (indexJson[RELEASE_CH]?.resourcesBasePath ?? '');
    
    console.log("Fetching resource data...");
    const resourceData = await getResponse(resourceApi);
    const resourceJson: ResourceResponse = JSON.parse(resourceData);
    
    const resources = resourceJson.resource;
    const resourceUrls: string[] = [];
    const resourceMd5: string[] = [];
    
    console.log(`Processing ${resources.length} total resources...`);
    
    let includedCount = 0;
    let totalSize = 0;
    
    for (const resource of resources) {
      if (!shouldIncludeFile(resource)) {
        continue;
      }
      
      includedCount++;
      totalSize += resource.size;
      
      let resourceDest = resource.dest;
      resourceUrls.push(resourceBase + resourceDest);
      
      if (MD5_FILE_CREATE) {
        if (MD5_FILE_FULL_PATH) {
          resourceDest = resourceDest.substring(1); // Remove leading slash
        } else {
          resourceDest = resourceDest.split("/").pop() || resourceDest;
        }
        resourceMd5.push(`${resource.md5} *${resourceDest}`);
      }
    }
    
    console.log(`Found ${includedCount} resources to download (${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB)`);
    
    // Write URLs file
    const urlsFileName = getName("urls.txt");
    writeFileSync(urlsFileName, resourceUrls.join("\n"));
    console.log(`URLs written to: ${urlsFileName}`);
    
    // Write MD5 file if enabled
    if (MD5_FILE_CREATE) {
      const md5FileName = getName("hashes.md5");
      writeFileSync(md5FileName, resourceMd5.join("\n"));
      console.log(`MD5 hashes written to: ${md5FileName}`);
    }
    
    // Write detailed file list
    const detailsFileName = getName("details.txt");
    const details = resources
      .filter(shouldIncludeFile)
      .map(resource => {
        const sizeGB = (resource.size / 1024 / 1024 / 1024).toFixed(3);
        const sizeMB = (resource.size / 1024 / 1024).toFixed(1);
        const extension = resource.dest.split('.').pop()?.toUpperCase() || 'UNKNOWN';
        return `${resource.dest} | ${sizeMB}MB (${sizeGB}GB) | ${extension} | ${resource.md5}`;
      })
      .join('\n');
    
    writeFileSync(detailsFileName, `Total files: ${includedCount}\nTotal size: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB\n\nFile Details:\n${details}`);
    console.log(`File details written to: ${detailsFileName}`);
    
    console.log("Download preparation completed successfully!");
    
  } catch (error) {
    console.error("Error occurred:", error);
    process.exit(1);
  }
}

// Run the main function
main();