// Global state interface for the entire application
export interface GlobalAppState {
  // Navigation state
  currentPage: string;
  selectedGameId: number | string | null;
  
  // Power menu state
  showPowerMenu: boolean;
  selectedMenuIndex: number;
  
  // Header controls state
  header: {
    searchbar: {
      isActive: boolean;
      query: string;
      selectedIndex: number;
    };
    time: {
      format: '12h' | '24h';
      showSeconds: boolean;
    };
    network: {
      isConnected: boolean;
      signalStrength: number;
      connectionType: 'wifi' | 'ethernet' | 'offline';
    };
    users: {
      currentUser: string;
      showUserMenu: boolean;
      selectedUserIndex: number;
    };
    settings: {
      showSettingsMenu: boolean;
      selectedSettingIndex: number;
    };
    power: {
      showPowerMenu: boolean;
      selectedPowerIndex: number;
    };
  };
  
  // Home page state
  home: {
    gameSelect: {
      selectedIndex: number;
      backgroundImage: string | null;
    };
    navigation: {
      currentSection: 'library' | 'recent' | 'application';
      selectedSectionIndex: number;
    };
  };
  
  // Game details state
  gameDetails: {
    selectedActionIndex: number;
    showActions: boolean;
  };
  
  // Joystick/Controller state
  controller: {
    isConnected: boolean;
    controllerId: number | null;
    lastInput: {
      type: 'button' | 'axis' | 'dpad';
      value: number;
      timestamp: number;
    } | null;
  };
}

// Action types for state updates
export type GlobalStateAction = 
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'SET_SELECTED_GAME_ID'; payload: number | string | null }
  | { type: 'SET_POWER_MENU'; payload: { show: boolean; selectedIndex?: number } }
  | { type: 'SET_HEADER_SEARCHBAR'; payload: Partial<GlobalAppState['header']['searchbar']> }
  | { type: 'SET_HEADER_TIME'; payload: Partial<GlobalAppState['header']['time']> }
  | { type: 'SET_HEADER_NETWORK'; payload: Partial<GlobalAppState['header']['network']> }
  | { type: 'SET_HEADER_USERS'; payload: Partial<GlobalAppState['header']['users']> }
  | { type: 'SET_HEADER_SETTINGS'; payload: Partial<GlobalAppState['header']['settings']> }
  | { type: 'SET_HEADER_POWER'; payload: Partial<GlobalAppState['header']['power']> }
  | { type: 'SET_HOME_GAME_SELECT'; payload: Partial<GlobalAppState['home']['gameSelect']> }
  | { type: 'SET_HOME_NAVIGATION'; payload: Partial<GlobalAppState['home']['navigation']> }
  | { type: 'SET_GAME_DETAILS'; payload: Partial<GlobalAppState['gameDetails']> }
  | { type: 'SET_CONTROLLER'; payload: Partial<GlobalAppState['controller']> };

// Initial state
export const initialGlobalState: GlobalAppState = {
  currentPage: 'home',
  selectedGameId: null,
  showPowerMenu: false,
  selectedMenuIndex: 0,
  
  header: {
    searchbar: {
      isActive: false,
      query: '',
      selectedIndex: 0,
    },
    time: {
      format: '24h',
      showSeconds: false,
    },
    network: {
      isConnected: true,
      signalStrength: 100,
      connectionType: 'wifi',
    },
    users: {
      currentUser: 'Player',
      showUserMenu: false,
      selectedUserIndex: 0,
    },
    settings: {
      showSettingsMenu: false,
      selectedSettingIndex: 0,
    },
    power: {
      showPowerMenu: false,
      selectedPowerIndex: 0,
    },
  },
  
  home: {
    gameSelect: {
      selectedIndex: 0,
      backgroundImage: null,
    },
    navigation: {
      currentSection: 'library',
      selectedSectionIndex: 0,
    },
  },
  
  gameDetails: {
    selectedActionIndex: 0,
    showActions: false,
  },
  
  controller: {
    isConnected: false,
    controllerId: null,
    lastInput: null,
  },
};