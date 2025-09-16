import { useEffect, useCallback } from 'react';
import { useGlobalState, useNavigation, usePowerMenu, useHeaderControls, useHomeControls, useGameDetails } from './useGlobalState';

export function useKeyboardNavigation() {
  const { state } = useGlobalState();
  const navigation = useNavigation();
  const powerMenu = usePowerMenu();
  const headerControls = useHeaderControls();
  const homeControls = useHomeControls();
  const gameDetails = useGameDetails();

  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent default behavior for navigation keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(event.key)) {
      event.preventDefault();
    }

    // Global ESC key handling
    if (event.key === 'Escape') {
      // If any menu is open, close it first
      if (state.showPowerMenu) {
        powerMenu.setPowerMenu(false);
        return;
      }
      if (headerControls.searchbar.isActive) {
        headerControls.searchbar.update({ isActive: false, query: '', selectedIndex: 0 });
        return;
      }
      if (headerControls.users.showUserMenu) {
        headerControls.users.update({ showUserMenu: false, selectedUserIndex: 0 });
        return;
      }
      if (headerControls.settings.showSettingsMenu) {
        headerControls.settings.update({ showSettingsMenu: false, selectedSettingIndex: 0 });
        return;
      }
      if (headerControls.power.showPowerMenu) {
        headerControls.power.update({ showPowerMenu: false, selectedPowerIndex: 0 });
        return;
      }
      
      // If on game details page, go back to home
      if (state.currentPage === 'gamedetail') {
        navigation.setCurrentPage('home');
        navigation.setSelectedGameId(null);
        return;
      }
      
      // Otherwise, open power menu
      powerMenu.setPowerMenu(true);
      powerMenu.setSelectedMenuIndex(0);
      return;
    }

    // Handle navigation based on current context
    if (headerControls.power.showPowerMenu) {
      handleHeaderPowerMenuNavigation(event);
    } else if (state.showPowerMenu) {
      handlePowerMenuNavigation(event);
    } else if (headerControls.searchbar.isActive) {
      handleSearchbarNavigation(event);
    } else if (headerControls.users.showUserMenu) {
      handleUserMenuNavigation(event);
    } else if (headerControls.settings.showSettingsMenu) {
      handleSettingsMenuNavigation(event);
    } else {
      // Global navigation when no menus are open
      handleGlobalNavigation(event);
    }
  }, [state, navigation, powerMenu, headerControls, homeControls, gameDetails]);

  const handlePowerMenuNavigation = useCallback((event: KeyboardEvent) => {
    const menuItems = ['Power Off', 'Restart'];
    
    switch (event.key) {
      case 'ArrowUp':
        powerMenu.setSelectedMenuIndex(
          state.selectedMenuIndex > 0 ? state.selectedMenuIndex - 1 : menuItems.length - 1
        );
        break;
      case 'ArrowDown':
        powerMenu.setSelectedMenuIndex(
          state.selectedMenuIndex < menuItems.length - 1 ? state.selectedMenuIndex + 1 : 0
        );
        break;
      case 'Enter':
        // Handle power menu selection
        const selectedAction = menuItems[state.selectedMenuIndex];
        console.log(`Power action: ${selectedAction}`);
        powerMenu.setPowerMenu(false);
        powerMenu.setSelectedMenuIndex(0);
        break;
    }
  }, [state.selectedMenuIndex, powerMenu]);

  const handleSearchbarNavigation = useCallback((event: KeyboardEvent) => {
    // Handle search suggestions navigation
    switch (event.key) {
      case 'ArrowUp':
        headerControls.searchbar.update({
          selectedIndex: Math.max(0, headerControls.searchbar.selectedIndex - 1)
        });
        break;
      case 'ArrowDown':
        headerControls.searchbar.update({
          selectedIndex: headerControls.searchbar.selectedIndex + 1
        });
        break;
      case 'Enter':
        // Execute search or select suggestion
        console.log(`Search: ${headerControls.searchbar.query}`);
        headerControls.searchbar.update({ isActive: false });
        break;
    }
  }, [headerControls.searchbar]);

  const handleUserMenuNavigation = useCallback((event: KeyboardEvent) => {
    const userMenuItems = ['Profile', 'Switch User', 'Sign Out'];
    
    switch (event.key) {
      case 'ArrowUp':
        headerControls.users.update({
          selectedUserIndex: headerControls.users.selectedUserIndex > 0 
            ? headerControls.users.selectedUserIndex - 1 
            : userMenuItems.length - 1
        });
        break;
      case 'ArrowDown':
        headerControls.users.update({
          selectedUserIndex: headerControls.users.selectedUserIndex < userMenuItems.length - 1
            ? headerControls.users.selectedUserIndex + 1
            : 0
        });
        break;
      case 'Enter':
        console.log(`User action: ${userMenuItems[headerControls.users.selectedUserIndex]}`);
        headerControls.users.update({ showUserMenu: false, selectedUserIndex: 0 });
        break;
    }
  }, [headerControls.users]);

  const handleSettingsMenuNavigation = useCallback((event: KeyboardEvent) => {
    const settingsItems = ['Display', 'Audio', 'Controls', 'Network', 'System'];
    
    switch (event.key) {
      case 'ArrowUp':
        headerControls.settings.update({
          selectedSettingIndex: headerControls.settings.selectedSettingIndex > 0
            ? headerControls.settings.selectedSettingIndex - 1
            : settingsItems.length - 1
        });
        break;
      case 'ArrowDown':
        headerControls.settings.update({
          selectedSettingIndex: headerControls.settings.selectedSettingIndex < settingsItems.length - 1
            ? headerControls.settings.selectedSettingIndex + 1
            : 0
        });
        break;
      case 'Enter':
        console.log(`Settings: ${settingsItems[headerControls.settings.selectedSettingIndex]}`);
        navigation.setCurrentPage('settings');
        headerControls.settings.update({ showSettingsMenu: false, selectedSettingIndex: 0 });
        break;
    }
  }, [headerControls.settings, navigation]);

  const handleHeaderPowerMenuNavigation = useCallback((event: KeyboardEvent) => {
    const powerItems = ['Sleep', 'Restart', 'Shutdown'];
    
    switch (event.key) {
      case 'ArrowUp':
        headerControls.power.update({
          selectedPowerIndex: headerControls.power.selectedPowerIndex > 0
            ? headerControls.power.selectedPowerIndex - 1
            : powerItems.length - 1
        });
        break;
      case 'ArrowDown':
        headerControls.power.update({
          selectedPowerIndex: headerControls.power.selectedPowerIndex < powerItems.length - 1
            ? headerControls.power.selectedPowerIndex + 1
            : 0
        });
        break;
      case 'Enter':
        console.log(`Power action: ${powerItems[headerControls.power.selectedPowerIndex]}`);
        headerControls.power.update({ showPowerMenu: false, selectedPowerIndex: 0 });
        break;
    }
  }, [headerControls.power]);

  const handleGlobalNavigation = useCallback((event: KeyboardEvent) => {
    // Global navigation between header and page content
    switch (event.key) {
      case 'ArrowUp':
        // Navigate to header controls when pressing up
        if (state.currentPage === 'home' || state.currentPage === 'gamedetail') {
          // Focus on the first header control (searchbar)
          headerControls.searchbar.update({ isActive: true });
        }
        break;
      case 'ArrowDown':
        // Navigate from header to page content
        if (headerControls.searchbar.isActive) {
          headerControls.searchbar.update({ isActive: false, query: '', selectedIndex: 0 });
          // Focus will return to page content
        } else {
          // Handle page-specific navigation
          if (state.currentPage === 'home') {
            handleHomeNavigation(event);
          } else if (state.currentPage === 'gamedetail') {
            handleGameDetailsNavigation(event);
          }
        }
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        // Handle horizontal navigation based on current page
        if (state.currentPage === 'home') {
          handleHomeNavigation(event);
        } else if (state.currentPage === 'gamedetail') {
          handleGameDetailsNavigation(event);
        }
        break;
      case 'Enter':
        // Handle enter key based on current page
        if (state.currentPage === 'home') {
          handleHomeNavigation(event);
        } else if (state.currentPage === 'gamedetail') {
          handleGameDetailsNavigation(event);
        }
        break;
    }
  }, [state, headerControls, homeControls, gameDetails]);

  const handleHomeNavigation = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowLeft':
        homeControls.gameSelect.setGameSelect({
          selectedIndex: homeControls.gameSelect.selectedIndex > 0 
            ? homeControls.gameSelect.selectedIndex - 1 
            : 0 // Will be set to max games length in component
        });
        break;
      case 'ArrowRight':
        homeControls.gameSelect.setGameSelect({
          selectedIndex: homeControls.gameSelect.selectedIndex + 1 // Will be clamped in component
        });
        break;
      case 'ArrowUp':
        // Navigate between sections (library, recent, application)
        const sections = ['library', 'recent', 'application'] as const;
        const currentSectionIndex = sections.indexOf(homeControls.navigation.currentSection);
        const newSectionIndex = currentSectionIndex > 0 ? currentSectionIndex - 1 : sections.length - 1;
        homeControls.navigation.setNavigation({
          currentSection: sections[newSectionIndex],
          selectedSectionIndex: newSectionIndex
        });
        break;
      case 'ArrowDown':
        // Navigate between sections (library, recent, application)
        const sectionsDown = ['library', 'recent', 'application'] as const;
        const currentSectionIndexDown = sectionsDown.indexOf(homeControls.navigation.currentSection);
        const newSectionIndexDown = currentSectionIndexDown < sectionsDown.length - 1 ? currentSectionIndexDown + 1 : 0;
        homeControls.navigation.setNavigation({
          currentSection: sectionsDown[newSectionIndexDown],
          selectedSectionIndex: newSectionIndexDown
        });
        break;
      case 'Enter':
        // Select current game
        console.log(`Selected game index: ${homeControls.gameSelect.selectedIndex}`);
        // This will be handled by the Home component
        break;
    }
  }, [homeControls]);

  const handleGameDetailsNavigation = useCallback((event: KeyboardEvent) => {
    const actions = ['Play', 'Install', 'Uninstall', 'Properties'];
    
    switch (event.key) {
      case 'ArrowUp':
        if (gameDetails.showActions) {
          // Navigate through action buttons
          gameDetails.setGameDetails({
            selectedActionIndex: gameDetails.selectedActionIndex > 0
              ? gameDetails.selectedActionIndex - 1
              : actions.length - 1
          });
        } else {
          // Show actions when navigating up from game info
          gameDetails.setGameDetails({
            showActions: true,
            selectedActionIndex: actions.length - 1
          });
        }
        break;
      case 'ArrowDown':
        if (gameDetails.showActions) {
          // Navigate through action buttons
          gameDetails.setGameDetails({
            selectedActionIndex: gameDetails.selectedActionIndex < actions.length - 1
              ? gameDetails.selectedActionIndex + 1
              : 0
          });
        }
        break;
      case 'ArrowLeft':
        // Navigate back to home
        navigation.setCurrentPage('home');
        gameDetails.setGameDetails({
          showActions: false,
          selectedActionIndex: 0
        });
        break;
      case 'Enter':
        if (gameDetails.showActions) {
          console.log(`Game action: ${actions[gameDetails.selectedActionIndex]}`);
          // Handle the specific action
          switch (gameDetails.selectedActionIndex) {
            case 0: // Play
              console.log('Starting game...');
              break;
            case 1: // Install
              console.log('Installing game...');
              break;
            case 2: // Uninstall
              console.log('Uninstalling game...');
              break;
            case 3: // Properties
              console.log('Opening game properties...');
              break;
          }
        } else {
          // Show actions when pressing enter on game info
          gameDetails.setGameDetails({
            showActions: true,
            selectedActionIndex: 0
          });
        }
        break;
    }
  }, [gameDetails, navigation]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return {
    // Expose navigation functions for programmatic use
    navigatePowerMenu: handlePowerMenuNavigation,
    navigateHeaderPowerMenu: handleHeaderPowerMenuNavigation,
    navigateSearchbar: handleSearchbarNavigation,
    navigateUserMenu: handleUserMenuNavigation,
    navigateSettingsMenu: handleSettingsMenuNavigation,
    navigateHome: handleHomeNavigation,
    navigateGameDetails: handleGameDetailsNavigation,
    navigateGlobal: handleGlobalNavigation,
    // Legacy method for backward compatibility
    handleKeyPress: (key: string, keyMap: Record<string, () => void>) => {
      if (keyMap[key]) {
        keyMap[key]();
      }
    },
  };
}