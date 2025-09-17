export interface WuwaResource {
  dest: string;
  url: string;
  size?: number;
  md5?: string;
}

export interface WuwaGameData {
  baseUrl: string;
  cdnUrl: string;
  resourcesPath: string;
  resourcesBasePath: string;
  totalResources: number;
  totalSize: number;
  resources: WuwaResource[];
}

export interface WuwaFetchResult {
  success: boolean;
  data?: WuwaGameData;
  error?: string;
}

export class WuwaFetcher {
  private static readonly BASE_URL = `${import.meta.env.VITE_WUWA_MANIFEST_URL}/launcher/game/G153/50004_obOHXFrFanqsaIEOmuKroCcbZkQRBC7c/index.json`;
  
  /**
   * Fetch Wuthering Waves game data and resources
   */
  static async fetchGameData(): Promise<WuwaFetchResult> {
    try {
      console.log(`Fetching data from: ${this.BASE_URL}`);
      
      // Fetch the base JSON
      const baseResponse = await fetch(this.BASE_URL);
      if (!baseResponse.ok) {
        throw new Error(`HTTP error! status: ${baseResponse.status}`);
      }
      
      const baseData = await baseResponse.json();
      console.log("✅ Successfully fetched base JSON");
      
      // Extract CDN URL and resources path
      const cdnUrl = baseData.default?.cdnList?.[0]?.url;
      const resourcesPath = baseData.default?.resources;
      const resourcesBasePath = baseData.default?.resourcesBasePath;
      const gameSize = baseData.default.config.size;
      
      if (!cdnUrl || !resourcesPath || !resourcesBasePath) {
        throw new Error("Missing required fields in base JSON");
      }
      
      console.log(`CDN URL: ${cdnUrl}`);
      console.log(`Resources path: ${resourcesPath}`);
      console.log(`Resources base path: ${resourcesBasePath}`);
      console.log(`Config game size: ${this.formatBytes(gameSize)}`);
      console.log(`Game size will be calculated from individual resources`);
      
      // Construct URL for resources
      // Use direct CDN URL with environment variable
      const resourcesUrl = `${import.meta.env.VITE_WUWA_RESOURCES_URL}/${resourcesPath}`;
      console.log(`Resources URL (direct): ${resourcesUrl}`);
      
      // Fetch resources JSON
      console.log("Fetching resources JSON...");
      const resourcesResponse = await fetch(resourcesUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });
      if (!resourcesResponse.ok) {
        throw new Error(`HTTP error! status: ${resourcesResponse.status} - ${resourcesResponse.statusText}`);
      }
      
      const resourcesData = await resourcesResponse.json();
      console.log("✅ Successfully fetched resources JSON");
      
      // Process all resources
      if (!resourcesData.resource || !Array.isArray(resourcesData.resource)) {
        throw new Error("No 'resource' array found in resources JSON");
      }
      
      const resources: WuwaResource[] = [];
      let totalSize = 0;
      
      for (const resource of resourcesData.resource) {
        const dest = resource.dest;
        // Use direct CDN URL with environment variable for download URLs
        const outputUrl = `${import.meta.env.VITE_WUWA_RESOURCES_URL}/${resourcesBasePath}/${dest}`;
        const size = resource.size || 0;
        
        resources.push({
          dest,
          url: outputUrl,
          size,
          md5: resource.md5
        });
        
        totalSize += size;
      }
      
      console.log(`Found ${resources.length} resources, calculated total size: ${this.formatBytes(totalSize)}`);
      console.log(`Config size was: ${this.formatBytes(gameSize)}, using calculated size instead`);
      
      const gameData: WuwaGameData = {
        baseUrl: this.BASE_URL,
        cdnUrl,
        resourcesPath,
        resourcesBasePath,
        totalResources: resources.length,
        totalSize: totalSize, // Use calculated totalSize from resources instead of gameSize
        resources
      };
      
      return {
        success: true,
        data: gameData
      };
      
    } catch (error) {
      console.error("❌ Error fetching Wuwa game data:", error);
      
      // Log more details about the error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error("This is likely a CORS error. Make sure CEF has web security disabled or CORS is properly configured.");
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }
  
  /**
   * Get download URLs for all resources
   */
  static getDownloadUrls(gameData: WuwaGameData): string[] {
    return gameData.resources.map(resource => resource.url);
  }
  
  /**
   * Format bytes to human readable format
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Calculate total download size
   */
  static calculateTotalSize(gameData: WuwaGameData): string {
    return this.formatBytes(gameData.totalSize);
  }
  
  /**
   * Get resource by destination path
   */
  static getResourceByDest(gameData: WuwaGameData, dest: string): WuwaResource | undefined {
    return gameData.resources.find(resource => resource.dest === dest);
  }
  
  /**
   * Filter resources by file extension
   */
  static filterResourcesByExtension(gameData: WuwaGameData, extension: string): WuwaResource[] {
    return gameData.resources.filter(resource => resource.dest.endsWith(extension));
  }
}

export default WuwaFetcher;