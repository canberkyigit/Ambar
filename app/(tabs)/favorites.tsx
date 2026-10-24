import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useBarsStore } from '../../src/stores/useBarsStore';
import { useAchievementStore } from '../../src/stores/useAchievementStore';
import { MOCK_BARS } from '../../src/data/bars';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { ScreenHeader, SearchField, IconButton, Sheet, Button } from '../../src/components/ui';
import { haptics } from '../../src/utils/haptics';
import { typography, spacing, borderRadius, GUTTER, TAB_BAR_CLEARANCE } from '../../src/theme';
import type { Bar } from '../../src/types/bar';

/** Approximate distance in km between two lat/lng points (Haversine). */
function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function BarsScreen() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const {
    getRating,
    getAverageRating,
    toggleSavedBar,
    isBarSaved,
    setRating,
    filterCocktailName,
    setFilterCocktailName,
  } = useBarsStore();

  const markUnique = useAchievementStore((s) => s.markUnique);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBar, setSelectedBar] = useState<Bar | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (filterCocktailName) {
      setSearchQuery(filterCocktailName);
      setFilterCocktailName(null);
    }
  }, [filterCocktailName, setFilterCocktailName]);

  const filteredBars = useMemo(() => {
    let list = MOCK_BARS;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.country.toLowerCase().includes(q) ||
          b.menu.some((m) => m.cocktailName.toLowerCase().includes(q)),
      );
    }

    if (userLocation) {
      list = [...list].sort(
        (a, b) =>
          distanceKm(userLocation.latitude, userLocation.longitude, a.latitude, a.longitude) -
          distanceKm(userLocation.latitude, userLocation.longitude, b.latitude, b.longitude),
      );
    }

    return list;
  }, [searchQuery, userLocation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const requestLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      // ignore
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        } catch {
          // ignore
        }
      }
    })();
  }, []);

  const formatDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`);
  const selectedRating = selectedBar
    ? getAverageRating(selectedBar.id, selectedBar.rating, selectedBar.reviewCount)
    : null;
  const myRating = selectedBar ? getRating(selectedBar.id) : null;
  const selectedSaved = selectedBar ? isBarSaved(selectedBar.id) : false;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, filteredBars.length === 0 && styles.listContentEmpty]}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        <ScreenHeader
          title="Bars"
          subtitle={userLocation ? 'Sorted by distance from you' : 'The world\'s best cocktail bars'}
          right={
            locationLoading ? (
              <View style={styles.locating}>
                <ActivityIndicator size="small" color={theme.accent} />
              </View>
            ) : (
              <IconButton
                icon={userLocation ? 'navigate' : 'navigate-outline'}
                variant={userLocation ? 'tinted' : 'surface'}
                onPress={requestLocation}
                accessibilityLabel={userLocation ? 'Refresh location' : 'Sort by distance'}
              />
            )
          }
        />
        <SearchField
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Bar, city or cocktail"
          style={styles.search}
        />

        {filteredBars.length === 0 ? (
          <EmptyState
            icon="map-outline"
            title="No bars found"
            subtitle="Try a city, a bar name or a cocktail like “Negroni”."
          />
        ) : (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            {filteredBars.map((bar, i) => {
              const distKm = userLocation
                ? distanceKm(userLocation.latitude, userLocation.longitude, bar.latitude, bar.longitude)
                : null;
              const { rating: avgRating, count: reviewCount } = getAverageRating(bar.id, bar.rating, bar.reviewCount);
              return (
                <Pressable
                  key={bar.id}
                  onPress={() => {
                    markUnique('world_traveler', bar.country);
                    setSelectedBar(bar);
                  }}
                  style={({ pressed }) => [styles.barRow, pressed && { backgroundColor: theme.surfaceSecondary }]}
                  accessibilityRole="button"
                  accessibilityLabel={`${bar.name}, ${bar.city}`}
                >
                  <View style={[styles.monogram, { backgroundColor: theme.accentLight }]}>
                    <Text style={[styles.monogramText, { color: theme.accent }]}>{bar.name.charAt(0)}</Text>
                  </View>
                  <View style={[styles.barBody, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.bodyBold, { color: theme.text }]} numberOfLines={1}>
                        {bar.name}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                        {bar.city}, {bar.country}
                        {distKm !== null && ` · ${formatDistance(distKm)}`}
                      </Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={12} color={theme.star} />
                      <Text style={[typography.captionBold, { color: theme.text }]}>{avgRating.toFixed(1)}</Text>
                      <Text style={[typography.small, { color: theme.textTertiary }]}>({reviewCount})</Text>
                    </View>
                    {isBarSaved(bar.id) && <Ionicons name="bookmark" size={14} color={theme.accent} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Sheet visible={!!selectedBar} onClose={() => setSelectedBar(null)} title={selectedBar?.name}>
        {selectedBar && selectedRating && (
          <>
            <View style={styles.sheetMeta}>
              <Ionicons name="star" size={14} color={theme.star} />
              <Text style={[typography.bodyBold, { color: theme.text }]}>{selectedRating.rating.toFixed(1)}</Text>
              <Text style={[typography.caption, { color: theme.textSecondary }]}>
                {selectedRating.count.toLocaleString()} reviews
              </Text>
            </View>
            <Text style={[typography.body, { color: theme.textSecondary, marginTop: spacing.xs }]}>
              {selectedBar.address ? `${selectedBar.address}, ` : ''}
              {selectedBar.city}, {selectedBar.country}
            </Text>

            <Button
              title={selectedSaved ? 'Saved' : 'Save bar'}
              icon={selectedSaved ? 'bookmark' : 'bookmark-outline'}
              variant={selectedSaved ? 'tinted' : 'secondary'}
              fullWidth
              onPress={() => toggleSavedBar(selectedBar.id)}
              style={{ marginTop: spacing.lg }}
            />

            <Text style={[typography.overline, styles.sheetLabel, { color: theme.textSecondary }]}>
              {myRating ? 'Your rating' : 'Rate this bar'}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = myRating != null && star <= myRating;
                return (
                  <Pressable
                    key={star}
                    onPress={() => {
                      haptics.selection();
                      setRating(selectedBar.id, star);
                    }}
                    hitSlop={6}
                    style={styles.starBtn}
                    accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Ionicons name={filled ? 'star' : 'star-outline'} size={30} color={filled ? theme.star : theme.textTertiary} />
                  </Pressable>
                );
              })}
            </View>

            <Text style={[typography.overline, styles.sheetLabel, { color: theme.textSecondary }]}>On the menu</Text>
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.menuCard, { backgroundColor: theme.surface }]}>
                {selectedBar.menu.map((item, i) => (
                  <Pressable
                    key={item.cocktailId}
                    onPress={() => {
                      setSelectedBar(null);
                      router.push(`/cocktail/${item.cocktailId}`);
                    }}
                    style={({ pressed }) => [
                      styles.menuItem,
                      i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.separator },
                      pressed && { backgroundColor: theme.surfaceSecondary },
                    ]}
                  >
                    <Text style={[typography.body, { color: theme.text, flex: 1 }]} numberOfLines={1}>
                      {item.cocktailName}
                    </Text>
                    {!!item.price && <Text style={[typography.body, { color: theme.textSecondary }]}>{item.price}</Text>}
                    <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </>
        )}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  search: { paddingHorizontal: GUTTER, marginBottom: spacing.lg },
  locating: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { paddingBottom: TAB_BAR_CLEARANCE },
  listContentEmpty: { flexGrow: 1 },
  card: { marginHorizontal: GUTTER, borderRadius: borderRadius.lg, overflow: 'hidden' },
  barRow: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md },
  monogram: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { ...typography.h3 },
  barBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginLeft: spacing.md,
    paddingRight: spacing.md,
    paddingVertical: spacing.md + 2,
  },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: -spacing.sm },
  sheetLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  starsRow: { flexDirection: 'row', gap: spacing.xs },
  starBtn: { padding: 2 },
  menuScroll: { maxHeight: 240 },
  menuCard: { borderRadius: borderRadius.lg, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
  },
});
