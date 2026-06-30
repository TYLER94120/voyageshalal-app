import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import {
  addItem,
  findTripByCity,
  hasItem,
  loadTrips,
  makeTrip,
  moveItem,
  removeItem,
  removeTrip,
  saveTrips,
  setDays,
  upsertTrip,
  type Trip,
  type TripItem,
} from '@/lib/trips';

interface TripsValue {
  trips: Trip[];
  ready: boolean;
  getCityTrip: (citySlug: string) => Trip | undefined;
  isInTrip: (citySlug: string, itemId: string) => boolean;
  addToTrip: (
    city: { slug: string; nom: string; latitude?: number; longitude?: number },
    item: Omit<TripItem, 'day'>,
    day?: number,
  ) => void;
  removeFromTrip: (citySlug: string, itemId: string) => void;
  moveItemDay: (citySlug: string, itemId: string, day: number) => void;
  setTripDays: (citySlug: string, days: number) => void;
  deleteTrip: (citySlug: string) => void;
}

const TripsContext = createContext<TripsValue | null>(null);

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadTrips().then((list) => {
      setTrips(list);
      setReady(true);
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (loaded.current) saveTrips(trips);
  }, [trips]);

  const getCityTrip = useCallback((citySlug: string) => findTripByCity(trips, citySlug), [trips]);

  const isInTrip = useCallback(
    (citySlug: string, itemId: string) => {
      const t = findTripByCity(trips, citySlug);
      return t ? hasItem(t, itemId) : false;
    },
    [trips],
  );

  const addToTrip = useCallback<TripsValue['addToTrip']>((city, item, day = 1) => {
    setTrips((prev) => {
      const now = Date.now();
      const existing = findTripByCity(prev, city.slug);
      const base =
        existing ?? makeTrip(city.slug, city.nom, { latitude: city.latitude, longitude: city.longitude }, now);
      return upsertTrip(prev, addItem(base, item, day, now));
    });
  }, []);

  const removeFromTrip = useCallback((citySlug: string, itemId: string) => {
    setTrips((prev) => {
      const t = findTripByCity(prev, citySlug);
      return t ? upsertTrip(prev, removeItem(t, itemId, Date.now())) : prev;
    });
  }, []);

  const moveItemDay = useCallback((citySlug: string, itemId: string, day: number) => {
    setTrips((prev) => {
      const t = findTripByCity(prev, citySlug);
      return t ? upsertTrip(prev, moveItem(t, itemId, day, Date.now())) : prev;
    });
  }, []);

  const setTripDays = useCallback((citySlug: string, days: number) => {
    setTrips((prev) => {
      const t = findTripByCity(prev, citySlug);
      return t ? upsertTrip(prev, setDays(t, days, Date.now())) : prev;
    });
  }, []);

  const deleteTrip = useCallback((citySlug: string) => {
    setTrips((prev) => removeTrip(prev, citySlug));
  }, []);

  return (
    <TripsContext.Provider
      value={{ trips, ready, getCityTrip, isInTrip, addToTrip, removeFromTrip, moveItemDay, setTripDays, deleteTrip }}
    >
      {children}
    </TripsContext.Provider>
  );
}

export function useTrips(): TripsValue {
  const ctx = useContext(TripsContext);
  if (!ctx) throw new Error('useTrips doit être utilisé dans un TripsProvider');
  return ctx;
}
