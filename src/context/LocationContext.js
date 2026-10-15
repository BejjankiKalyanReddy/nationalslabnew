import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getAddressesByUser, createAddress, deleteAddress, updateUser } from '../services/api';

const LocationContext = createContext(null);

export const LocationProvider = ({ children }) => {
  const { user } = useAuth();
  const [locations, setLocations] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('currentLocation');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      if (currentLocation) {
        localStorage.setItem('currentLocation', JSON.stringify(currentLocation));
      } else {
        localStorage.removeItem('currentLocation');
      }
    } catch (_) {}
  }, [currentLocation]);

  // Fetch addresses when user changes
  const fetchLocations = useCallback(async () => {
    if (!user || !user.user_id) {
      setLocations([]);
      return;
    }
    setLoadingLocations(true);
    try {
      const data = await getAddressesByUser(user.user_id);
      const addressList = Array.isArray(data) ? data : [];
      setLocations(addressList);

      if (addressList.length > 0) {
        // Find default or first address
        const matched = user.defaultAddressId
          ? addressList.find((a) => a.address_id === user.defaultAddressId)
          : null;
        const active = matched || addressList[0];
        setCurrentLocation(active);
      }
    } catch (err) {
      console.error('Error loading locations:', err);
    } finally {
      setLoadingLocations(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Switch location
  const switchLocation = async (addressId) => {
    const selected = locations.find((l) => l.address_id === addressId);
    if (!selected) return;

    setCurrentLocation(selected);

    if (user && user.user_id) {
      try {
        await updateUser({
          user_id: user.user_id,
          defaultAddressId: selected.address_id,
        });
      } catch (err) {
        console.error('Error updating default address on backend:', err);
      }
    }
  };

  // Add new address
  const addNewAddress = async (newAddressData) => {
    if (!user || !user.user_id) {
      // Guest manual address
      const guestAddr = {
        address_id: 'guest_' + Date.now(),
        ...newAddressData,
      };
      setCurrentLocation(guestAddr);
      return guestAddr;
    }

    const payload = {
      user_id: user.user_id,
      ...newAddressData,
    };

    const saved = await createAddress(payload);
    await fetchLocations();
    if (saved && saved.address_id) {
      await switchLocation(saved.address_id);
    }
    return saved;
  };

  // Delete address
  const removeAddress = async (addressId) => {
    await deleteAddress(addressId);
    await fetchLocations();
    if (currentLocation?.address_id === addressId) {
      const remaining = locations.filter((l) => l.address_id !== addressId);
      setCurrentLocation(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // Manual guest location (e.g., entered by pincode)
  const setGuestLocation = (pincode, city = '') => {
    const guestLoc = {
      address_id: 'guest_' + Date.now(),
      postal_code: pincode,
      city: city || 'Local Area',
      address_line1: `Pincode: ${pincode}`,
      address_line2: city,
    };
    setCurrentLocation(guestLoc);
  };

  const openLocationModal = () => setIsLocationModalOpen(true);
  const closeLocationModal = () => setIsLocationModalOpen(false);

  // Formatted display text
  const locationDisplayText = currentLocation
    ? [currentLocation.city, currentLocation.postal_code].filter(Boolean).join(' - ') ||
      currentLocation.address_line1 ||
      'Selected Location'
    : 'Select Location';

  return (
    <LocationContext.Provider
      value={{
        locations,
        currentLocation,
        locationDisplayText,
        isLocationModalOpen,
        openLocationModal,
        closeLocationModal,
        switchLocation,
        addNewAddress,
        removeAddress,
        setGuestLocation,
        refreshLocations: fetchLocations,
        loadingLocations,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
