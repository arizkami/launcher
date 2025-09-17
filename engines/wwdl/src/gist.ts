import { GIST_INDEX_URL, SERVER_OPTIONS, ServerConfig } from './regionserver';

interface GistData {
  [key: string]: {
    [key: string]: string;
  };
}

interface VersionInfo {
  label: string;
  version: string;
  indexUrl: string;
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
      const { gunzipSync } = await import('zlib');
      const decompressed = gunzipSync(buffer);
      return new TextDecoder().decode(decompressed);
    } catch (error) {
      console.warn('Failed to decompress gzipped content, trying as plain text');
      return new TextDecoder().decode(buffer);
    }
  }
  
  return new TextDecoder().decode(buffer);
}

function getVersion(gistData: GistData, category: string, region: string): string {
  const categoryData = gistData[category];
  if (!categoryData) {
    throw new Error(`Category '${category}' not found in gist data`);
  }
  
  const url = categoryData[region];
  if (!url) {
    throw new Error(`Region '${region}' not found in category '${category}'`);
  }
  
  return url;
}

export async function fetchGistAndGetVersions(): Promise<VersionInfo[]> {
  console.log("Fetching gist data...");
  const gistData = await getResponse(GIST_INDEX_URL);
  const gistJson: GistData = JSON.parse(gistData);
  
  const versions: VersionInfo[] = [];
  
  for (const config of SERVER_OPTIONS) {
    try {
      const indexUrl = getVersion(gistJson, config.category, config.region);
      
      // Fetch version info from the index URL
      const indexData = await getResponse(indexUrl);
      const indexJson = JSON.parse(indexData);
      
      const version = indexJson?.default?.config?.version || 
                     indexJson?.default?.version || 
                     "unknown";
      
      versions.push({
        label: config.label,
        version: version,
        indexUrl: indexUrl
      });
    } catch (error) {
      console.warn(`Failed to fetch version for ${config.label}:`, error);
      versions.push({
        label: config.label,
        version: "unavailable",
        indexUrl: ""
      });
    }
  }
  
  return versions;
}

export async function selectVersion(): Promise<string> {
  const versions = await fetchGistAndGetVersions();
  
  console.log("\nAvailable versions:");
  versions.forEach((version, index) => {
    console.log(`${index + 1}. ${version.label} (${version.version})`);
  });
  
  // For now, return the first available version (Live - OS)
  // In a real interactive environment, you would prompt for user input
  const selectedVersion = versions.find(v => v.indexUrl !== "");
  if (!selectedVersion) {
    throw new Error("No available versions found");
  }
  
  console.log(`\nSelected: ${selectedVersion.label} (${selectedVersion.version})`);
  return selectedVersion.indexUrl;
}