// src/lib/rawgapi.ts
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const BASE_URL = 'https://api.rawg.io/api';

export interface Game {
  id: number;
  name: string;
  slug: string;
  description?: string;
  description_raw?: string;
  released?: string;
  background_image?: string;
  background_image_additional?: string;
  rating: number;
  rating_top: number;
  ratings_count: number;
  metacritic?: number;
  playtime: number;
  platforms?: Platform[];
  genres?: Genre[];
  developers?: Developer[];
  publishers?: Publisher[];
  esrb_rating?: ESRBRating;
  short_screenshots?: Screenshot[];
  tags?: Tag[];
  website?: string;
  reddit_url?: string;
  reddit_name?: string;
  reddit_description?: string;
  reddit_logo?: string;
  reddit_count?: number;
  twitch_count?: number;
  youtube_count?: number;
  reviews_text_count?: number;
  added: number;
  added_by_status?: AddedByStatus;
  parent_platforms?: ParentPlatform[];
  stores?: Store[];
}

export interface Platform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
  released_at?: string;
  requirements?: {
    minimum?: string;
    recommended?: string;
  };
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
}

export interface Developer {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
}

export interface Publisher {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
}

export interface ESRBRating {
  id: number;
  name: string;
  slug: string;
}

export interface Screenshot {
  id: number;
  image: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  language: string;
  games_count: number;
  image_background: string;
}

export interface AddedByStatus {
  yet: number;
  owned: number;
  beaten: number;
  toplay: number;
  dropped: number;
  playing: number;
}

export interface ParentPlatform {
  platform: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface Store {
  id: number;
  store: {
    id: number;
    name: string;
    slug: string;
    domain: string;
    games_count: number;
    image_background: string;
  };
}

export interface GameSearchResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Game[];
}

export interface GameScreenshotsResponse {
  count: number;
  next?: string;
  previous?: string;
  results: Screenshot[];
}

class RawgApiService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = RAWG_API_KEY;
    this.baseUrl = BASE_URL;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`RAWG API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async searchGames(query: string, page: number = 1, pageSize: number = 20): Promise<GameSearchResponse> {
    return this.makeRequest<GameSearchResponse>('/games', {
      search: query,
      page,
      page_size: pageSize,
      ordering: '-rating'
    });
  }

  async getGameDetails(gameId: number | string): Promise<Game> {
    return this.makeRequest<Game>(`/games/${gameId}`);
  }

  async getGameScreenshots(gameId: number | string): Promise<GameScreenshotsResponse> {
    return this.makeRequest<GameScreenshotsResponse>(`/games/${gameId}/screenshots`);
  }

  async getPopularGames(page: number = 1, pageSize: number = 20): Promise<GameSearchResponse> {
    return this.makeRequest<GameSearchResponse>('/games', {
      page,
      page_size: pageSize,
      ordering: '-rating',
      dates: '2020-01-01,2024-12-31'
    });
  }

  async getGamesByGenre(genreId: number, page: number = 1, pageSize: number = 20): Promise<GameSearchResponse> {
    return this.makeRequest<GameSearchResponse>('/games', {
      genres: genreId,
      page,
      page_size: pageSize,
      ordering: '-rating'
    });
  }

  async getNewReleases(page: number = 1, pageSize: number = 20): Promise<GameSearchResponse> {
    const currentDate = new Date();
    const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
    
    return this.makeRequest<GameSearchResponse>('/games', {
      dates: `${oneMonthAgo.toISOString().split('T')[0]},${currentDate.toISOString().split('T')[0]}`,
      page,
      page_size: pageSize,
      ordering: '-released'
    });
  }
}

export const rawgApi = new RawgApiService();