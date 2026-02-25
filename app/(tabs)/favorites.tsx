import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHeaderPadding } from '../../src/hooks/useHeaderPadding';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useThemeStore } from '../../src/stores/useThemeStore';
import { useBarsStore } from '../../src/stores/useBarsStore';
import { MOCK_BARS } from '../../src/data/bars';
import { EmptyState } from '../../src/components/shared/EmptyState';
import { typography, spacing, borderRadius } from '../../src/theme';
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
  const { paddingTop: headerPadding, insets } = useHeaderPadding();
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: headerPadding }]}>
      {/* Search */}
      <View style={[styles.searchWrap, { paddingHorizontal: spacing.lg }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Bar, city, country or cocktail..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
            </Pressable>
          )}
        </View>
        <View style={styles.headerRow}>
          <Text style={[styles.countText, { color: theme.textSecondary }]}>
            {userLocation
              ? `Nearby: ${filteredBars.length} bar${filteredBars.length !== 1 ? 's' : ''}`
              : `${filteredBars.length} bar${filteredBars.length !== 1 ? 's' : ''}`}
          </Text>
          <Pressable
            onPress={locationLoading ? undefined : requestLocation}
            style={[styles.locationBtn, { backgroundColor: userLocation ? theme.accent + '20' : theme.surface, borderColor: theme.border }]}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <>
                <Ionicons name="locate" size={18} color={theme.accent} />
                <Text style={[styles.locationBtnText, { color: theme.accent }]}>
                  {userLocation ? 'Nearby on' : 'Get location'}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 120 },
          filteredBars.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
        }
      >
        {filteredBars.length === 0 ? (
          <EmptyState
            icon="wine-outline"
            title="No bars found"
            subtitle="Try a different search or turn off location sorting"
          />
        ) : (
        filteredBars.map((bar) => {
          const distKm = userLocation
            ? distanceKm(userLocation.latitude, userLocation.longitude, bar.latitude, bar.longitude)
            : null;
          const { rating: avgRating, count: reviewCount } = getAverageRating(bar.id, bar.rating, bar.reviewCount);
          return (
            <Pressable
              key={bar.id}
              onPress={() => setSelectedBar(bar)}
              style={({ pressed }) => [
                styles.barCard,
                { backgroundColor: theme.surface, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <View style={[styles.barPin, { backgroundColor: theme.accent + '20' }]}>
                <Ionicons name="location" size={20} color={theme.accent} />
              </View>
              <View style={styles.barInfo}>
                <Text style={[styles.barName, { color: theme.text }]} numberOfLines={1}>
                  {bar.name}
                </Text>
                <Text style={[styles.barPlace, { color: theme.textSecondary }]}>
                  {bar.city}, {bar.country}
                  {distKm !== null && (
                    <Text style={[styles.barDistance, { color: theme.accent }]}>
                      {' · '}
                      {distKm < 1 ? `${Math.round(distKm * 1000)} m` : `${distKm.toFixed(1)} km`}
                    </Text>
                  )}
                </Text>
                <View style={styles.barMeta}>
                  <Ionicons name="star" size={12} color="#F59E0B" />
                  <Text style={[styles.barRating, { color: theme.text }]}>{avgRating.toFixed(1)}</Text>
                  <Text style={[styles.barReviews, { color: theme.textTertiary }]}>
                    {reviewCount} reviews
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
            </Pressable>
          );
        })
        )}
      </ScrollView>

      {/* Bar detail popup */}
      <Modal
        visible={!!selectedBar}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBar(null)}
      >
        <Pressable
          style={[styles.popupOverlay, { backgroundColor: theme.overlay }]}
          onPress={() => setSelectedBar(null)}
        >
          <Pressable style={[styles.popupCard, { backgroundColor: theme.background }]} onPress={() => {}}>
            {selectedBar && (
              <>
                <View style={styles.popupHeader}>
                  <Text style={[styles.sheetTitle, { color: theme.text }]} numberOfLines={1}>
                    {selectedBar.name}
                  </Text>
                  <Pressable
                    onPress={() => setSelectedBar(null)}
                    hitSlop={8}
                    style={[styles.popupCloseBtn, { backgroundColor: theme.surface }]}
                  >
                    <Ionicons name="close" size={22} color={theme.text} />
                  </Pressable>
                </View>
                <View style={styles.popupBody}>
                  <View style={styles.sheetTitleRow}>
                    <View style={styles.sheetMeta}>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={[styles.sheetRating, { color: theme.text }]}>
                        {getAverageRating(selectedBar.id, selectedBar.rating, selectedBar.reviewCount).rating.toFixed(1)}
                      </Text>
                      <Text style={[styles.sheetReviews, { color: theme.textSecondary }]}>
                        ({getAverageRating(selectedBar.id, selectedBar.rating, selectedBar.reviewCount).count} reviews)
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => toggleSavedBar(selectedBar.id)}
                      style={[styles.saveBarBtn, { backgroundColor: isBarSaved(selectedBar.id) ? theme.accent + '25' : theme.surface, borderColor: theme.border }]}
                    >
                      <Ionicons
                        name={isBarSaved(selectedBar.id) ? 'bookmark' : 'bookmark-outline'}
                        size={20}
                        color={theme.accent}
                      />
                      <Text style={[styles.saveBarBtnText, { color: theme.accent }]}>
                        {isBarSaved(selectedBar.id) ? 'Saved' : 'Save bar'}
                      </Text>
                    </Pressable>
                  </View>
                  <Text style={[styles.sheetAddress, { color: theme.textTertiary }]}>
                    {selectedBar.address ?? `${selectedBar.city}, ${selectedBar.country}`}
                  </Text>
                  <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Rate this bar</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => {
                      const current = getRating(selectedBar.id);
                      const filled = current != null ? star <= current : false;
                      return (
                        <Pressable
                          key={star}
                          onPress={() => setRating(selectedBar.id, star)}
                          hitSlop={8}
                          style={styles.starBtn}
                        >
                          <Ionicons
                            name={filled ? 'star' : 'star-outline'}
                            size={28}
                            color={filled ? '#F59E0B' : theme.textTertiary}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={[styles.menuLabel, { color: theme.textSecondary }]}>Cocktail menu</Text>
                  <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
                    <View style={styles.menuList}>
                      {selectedBar.menu.map((item) => (
                        <Pressable
                          key={item.cocktailId}
                          onPress={() => {
                            setSelectedBar(null);
                            router.push(`/cocktail/${item.cocktailId}`);
                          }}
                          style={({ pressed }) => [
                            styles.menuItem,
                            { backgroundColor: pressed ? theme.surface : 'transparent' },
                          ]}
                        >
                          <Text style={[styles.menuItemName, { color: theme.text }]} numberOfLines={1}>
                            {item.cocktailName}
                          </Text>
                          <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingTop: spacing.sm, paddingBottom: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    padding: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  countText: { ...typography.small },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  locationBtnText: { ...typography.small, fontWeight: '600' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  listContentEmpty: { flexGrow: 1 },
  barCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  barPin: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barInfo: { flex: 1 },
  barName: { ...typography.bodyBold, marginBottom: 2 },
  barPlace: { ...typography.small, marginBottom: 4 },
  barDistance: { ...typography.small, fontWeight: '600' },
  barMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barRating: { ...typography.captionBold },
  barReviews: { ...typography.small },
  popupOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  popupCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  popupCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupBody: {},
  sheetTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.xs },
  sheetTitle: { ...typography.h3, flex: 1 },
  saveBarBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.md, borderWidth: 1 },
  saveBarBtnText: { ...typography.small, fontWeight: '600' },
  sheetMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  sheetRating: { ...typography.captionBold },
  sheetReviews: { ...typography.small },
  sheetAddress: { ...typography.small, marginTop: 2 },
  rateLabel: { ...typography.small, marginTop: spacing.md, marginBottom: spacing.xs, fontWeight: '600' },
  starsRow: { flexDirection: 'row', gap: 4 },
  starBtn: { padding: 2 },
  menuLabel: { ...typography.small, marginBottom: spacing.sm, fontWeight: '600' },
  menuScroll: { maxHeight: 200 },
  menuList: { gap: 2 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  menuItemName: { ...typography.body, flex: 1 },
});
