import React, { useReducer, useContext, createContext, type ReactNode } from 'react';
import { type GlobalAppState, type GlobalStateAction, initialGlobalState } from '../types/globalState';

// Global state reducer
function globalStateReducer(state: GlobalAppState, action: GlobalStateAction): GlobalAppState {
  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };
    
    case 'SET_SELECTED_GAME_ID':
      return { ...state, selectedGameId: action.payload };
    
    case 'SET_POWER_MENU':
      return { 
        ...state, 
        showPowerMenu: action.payload.show,
        selectedMenuIndex: action.payload.selectedIndex ?? state.selectedMenuIndex
      };
    
    case 'SET_HEADER_SEARCHBAR':
      return {
        ...state,
        header: {
          ...state.header,
          searchbar: { ...state.header.searchbar, ...action.payload }
        }
      };
    
    case 'SET_HEADER_TIME':
      return {
        ...state,
        header: {
          ...state.header,
          time: { ...state.header.time, ...action.payload }
        }
      };
    
    case 'SET_HEADER_NETWORK':
      return {
        ...state,
        header: {
          ...state.header,
          network: { ...state.header.network, ...action.payload }
        }
      };
    
    case 'SET_HEADER_USERS':
      return {
        ...state,
        header: {
          ...state.header,
          users: { ...state.header.users, ...action.payload }
        }
      };
    
    case 'SET_HEADER_SETTINGS':
      return {
        ...state,
        header: {
          ...state.header,
          settings: { ...state.header.settings, ...action.payload }
        }
      };
    
    case 'SET_HEADER_POWER':
      return {
        ...state,
        header: {
          ...state.header,
          power: { ...state.header.power, ...action.payload }
        }
      };
    
    case 'SET_HOME_GAME_SELECT':
      return {
        ...state,
        home: {
          ...state.home,
          gameSelect: { ...state.home.gameSelect, ...action.payload }
        }
      };
    
    case 'SET_HOME_NAVIGATION':
      return {
        ...state,
        home: {
          ...state.home,
          navigation: { ...state.home.navigation, ...action.payload }
        }
      };
    
    case 'SET_GAME_DETAILS':
      return {
        ...state,
        gameDetails: { ...state.gameDetails, ...action.payload }
      };
    
    case 'SET_CONTROLLER':
      return {
        ...state,
        controller: { ...state.controller, ...action.payload }
      };
    
    default:
      return state;
  }
}

// Context for global state
const GlobalStateContext = createContext<{
  state: GlobalAppState;
  dispatch: React.Dispatch<GlobalStateAction>;
} | null>(null);

// Provider component
export function GlobalStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(globalStateReducer, initialGlobalState);
  
  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Main hook to access global state
export function useGlobalState() {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useGlobalState must be used within a GlobalStateProvider');
  }
  return context;
}

// Specific hooks for different sections
export function useNavigation() {
  const { state, dispatch } = useGlobalState();
  
  return {
    currentPage: state.currentPage,
    selectedGameId: state.selectedGameId,
    setCurrentPage: (page: string) => dispatch({ type: 'SET_CURRENT_PAGE', payload: page }),
    setSelectedGameId: (id: number | string | null) => dispatch({ type: 'SET_SELECTED_GAME_ID', payload: id }),
  };
}

// Power menu hook
export function usePowerMenu() {
  const { state, dispatch } = useGlobalState();
  
  return {
    isOpen: state.showPowerMenu,
    selectedIndex: state.selectedMenuIndex,
    setIsOpen: (isOpen: boolean) => dispatch({ type: 'SET_POWER_MENU', payload: { show: isOpen } }),
    setSelectedIndex: (index: number) => dispatch({ type: 'SET_POWER_MENU', payload: { show: state.showPowerMenu, selectedIndex: index } }),
    setPowerMenu: (show: boolean, index?: number) => {
      dispatch({ type: 'SET_POWER_MENU', payload: { show, selectedIndex: index } });
    },
    setSelectedMenuIndex: (index: number) => dispatch({ type: 'SET_POWER_MENU', payload: { show: state.showPowerMenu, selectedIndex: index } }),
  };
}

// Header controls hook
export function useHeaderControls() {
  const { state, dispatch } = useGlobalState();
  
  return {
    searchbar: {
      isActive: state.header.searchbar.isActive,
      query: state.header.searchbar.query,
      selectedIndex: state.header.searchbar.selectedIndex,
      update: (updates: Partial<typeof state.header.searchbar>) => 
        dispatch({ type: 'SET_HEADER_SEARCHBAR', payload: updates }),
    },
    time: {
      format: state.header.time.format,
      showSeconds: state.header.time.showSeconds,
      update: (updates: Partial<typeof state.header.time>) => 
        dispatch({ type: 'SET_HEADER_TIME', payload: updates }),
    },
    network: {
      isConnected: state.header.network.isConnected,
      signalStrength: state.header.network.signalStrength,
      connectionType: state.header.network.connectionType,
      update: (updates: Partial<typeof state.header.network>) => 
        dispatch({ type: 'SET_HEADER_NETWORK', payload: updates }),
    },
    users: {
      currentUser: state.header.users.currentUser,
      showUserMenu: state.header.users.showUserMenu,
      selectedUserIndex: state.header.users.selectedUserIndex,
      update: (updates: Partial<typeof state.header.users>) => 
        dispatch({ type: 'SET_HEADER_USERS', payload: updates }),
    },
    settings: {
      showSettingsMenu: state.header.settings.showSettingsMenu,
      selectedSettingIndex: state.header.settings.selectedSettingIndex,
      update: (updates: Partial<typeof state.header.settings>) => 
        dispatch({ type: 'SET_HEADER_SETTINGS', payload: updates }),
    },
    power: {
      showPowerMenu: state.header.power.showPowerMenu,
      selectedPowerIndex: state.header.power.selectedPowerIndex,
      update: (updates: Partial<typeof state.header.power>) => 
        dispatch({ type: 'SET_HEADER_POWER', payload: updates }),
    },
  };
}

// Home controls hook
export function useHomeControls() {
  const { state, dispatch } = useGlobalState();
  
  return {
    navigation: {
      currentSection: state.home.navigation.currentSection,
      selectedSectionIndex: state.home.navigation.selectedSectionIndex,
      setNavigation: (updates: Partial<typeof state.home.navigation>) => 
        dispatch({ type: 'SET_HOME_NAVIGATION', payload: updates }),
    },
    gameSelect: {
      selectedIndex: state.home.gameSelect.selectedIndex,
      backgroundImage: state.home.gameSelect.backgroundImage,
      setGameSelect: (updates: Partial<typeof state.home.gameSelect>) => 
        dispatch({ type: 'SET_HOME_GAME_SELECT', payload: updates }),
    },
  };
}

// Game details hook
export function useGameDetails() {
  const { state, dispatch } = useGlobalState();
  
  return {
    selectedActionIndex: state.gameDetails.selectedActionIndex,
    showActions: state.gameDetails.showActions,
    setGameDetails: (updates: Partial<typeof state.gameDetails>) => 
      dispatch({ type: 'SET_GAME_DETAILS', payload: updates }),
  };
}