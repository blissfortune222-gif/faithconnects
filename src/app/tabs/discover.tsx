import { gql, useLazyQuery } from "@apollo/client";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY = "#FF4F9A";
const PAGE_SIZE = 20;

type FilterType = "Discover" | "Nearby" | "Online" | "Verified";

type SortType =
  | "Recommended"
  | "Recently joined"
  | "Name (A–Z)"
  | "Online first"
  | "Verified first";

type DiscoverPerson = {
  id: string;
  fullName?: string;
  username?: string;
  age?: number;
  location?: string;
  profileImage?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  createdAt?: string;
};

type DiscoverQueryResult = {
  discoverNew?: DiscoverPerson[];
  discoverNearby?: DiscoverPerson[];
  discoverOnline?: DiscoverPerson[];
  discoverVerified?: DiscoverPerson[];
};

const USER_FIELDS = `
  id
  fullName
  username
  age
  location
  profileImage
  isOnline
  isVerified
`;

const DISCOVER_NEW_QUERY = gql`
  query DiscoverNew($limit: Int!, $offset: Int!) {
    discoverNew(limit: $limit, offset: $offset) {
      ${USER_FIELDS}
    }
  }
`;

const DISCOVER_NEARBY_QUERY = gql`
  query DiscoverNearby($limit: Int!, $offset: Int!) {
    discoverNearby(limit: $limit, offset: $offset) {
      ${USER_FIELDS}
    }
  }
`;

const DISCOVER_ONLINE_QUERY = gql`
  query DiscoverOnline($limit: Int!, $offset: Int!) {
    discoverOnline(limit: $limit, offset: $offset) {
      ${USER_FIELDS}
    }
  }
`;

const DISCOVER_VERIFIED_QUERY = gql`
  query DiscoverVerified($limit: Int!, $offset: Int!) {
    discoverVerified(limit: $limit, offset: $offset) {
      ${USER_FIELDS}
    }
  }
`;

const SORT_OPTIONS: SortType[] = [
  "Recommended",
  "Recently joined",
  "Name (A–Z)",
  "Online first",
  "Verified first",
];

export default function Discover() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("Discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [people, setPeople] = useState<DiscoverPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sortBy, setSortBy] = useState<SortType>("Recommended");
  const [sortVisible, setSortVisible] = useState(false);

  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const [discoverNew] = useLazyQuery<DiscoverQueryResult>(DISCOVER_NEW_QUERY, {
    fetchPolicy: "network-only",
  });

  const [discoverNearby] = useLazyQuery<DiscoverQueryResult>(
    DISCOVER_NEARBY_QUERY,
    { fetchPolicy: "network-only" },
  );

  const [discoverOnline] = useLazyQuery<DiscoverQueryResult>(
    DISCOVER_ONLINE_QUERY,
    { fetchPolicy: "network-only" },
  );

  const [discoverVerified] = useLazyQuery<DiscoverQueryResult>(
    DISCOVER_VERIFIED_QUERY,
    { fetchPolicy: "network-only" },
  );

  const loadPeople = useCallback(
    async (filter: FilterType, reset = true) => {
      if (!reset && (!hasMoreRef.current || loadingMoreRef.current)) {
        return;
      }

      const requestId = ++requestIdRef.current;
      const currentOffset = reset ? 0 : offsetRef.current;

      if (reset) {
        offsetRef.current = 0;
        hasMoreRef.current = true;
        loadingMoreRef.current = false;

        setLoading(true);
        setLoadingMore(false);
        setErrorMessage("");
        setPeople([]);
      } else {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      }

      try {
        const variables = {
          limit: PAGE_SIZE,
          offset: currentOffset,
        };

        let result: DiscoverPerson[] = [];

        switch (filter) {
          case "Discover": {
            const response = await discoverNew({ variables });
            result = response.data?.discoverNew ?? [];
            break;
          }

          case "Nearby": {
            const response = await discoverNearby({ variables });
            result = response.data?.discoverNearby ?? [];
            break;
          }

          case "Online": {
            const response = await discoverOnline({ variables });
            result = response.data?.discoverOnline ?? [];
            break;
          }

          case "Verified": {
            const response = await discoverVerified({ variables });
            result = response.data?.discoverVerified ?? [];
            break;
          }
        }

        if (requestId !== requestIdRef.current) return;

        setPeople((previous) => {
          if (reset) return result;

          const existingIds = new Set(previous.map((person) => person.id));

          const newPeople = result.filter(
            (person) => !existingIds.has(person.id),
          );

          return [...previous, ...newPeople];
        });

        offsetRef.current = currentOffset + result.length;
        hasMoreRef.current = result.length === PAGE_SIZE;
      } catch (error: any) {
        if (requestId !== requestIdRef.current) return;

        console.error("Discover query error:", error);

        setErrorMessage(
          error?.message || "Unable to load profiles. Please try again.",
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [discoverNew, discoverNearby, discoverOnline, discoverVerified],
  );

  useEffect(() => {
    loadPeople("Discover", true);
  }, [loadPeople]);

  const handleFilterChange = (filter: FilterType) => {
    if (filter === activeFilter) return;

    setActiveFilter(filter);
    loadPeople(filter, true);
  };

  const openUserProfile = (userId: string) => {
    if (!userId) return;

    router.push({
      pathname: "/user/[userId]",
      params: {
        userId: String(userId),
      },
    });
  };

  const filteredPeople = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    let result = people.filter((person) => {
      if (!search) return true;

      const name = person.fullName || "";
      const username = person.username || "";

      return (
        name.toLowerCase().includes(search) ||
        username.toLowerCase().includes(search)
      );
    });

    switch (sortBy) {
      case "Recently joined":
        result = [...result].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

          return dateB - dateA;
        });
        break;

      case "Name (A–Z)":
        result = [...result].sort((a, b) => {
          const nameA = (a.fullName || a.username || "").toLowerCase();
          const nameB = (b.fullName || b.username || "").toLowerCase();

          return nameA.localeCompare(nameB);
        });
        break;

      case "Online first":
        result = [...result].sort(
          (a, b) => Number(!!b.isOnline) - Number(!!a.isOnline),
        );
        break;

      case "Verified first":
        result = [...result].sort(
          (a, b) => Number(!!b.isVerified) - Number(!!a.isVerified),
        );
        break;

      default:
        break;
    }

    return result;
  }, [people, searchQuery, sortBy]);

  const filters: FilterType[] = ["Discover", "Nearby", "Online", "Verified"];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Find meaningful connections</Text>
        </View>

        <Pressable
          style={[
            styles.headerButton,
            sortVisible && styles.headerButtonActive,
          ]}
          onPress={() => setSortVisible(true)}>
          <Ionicons name="options-outline" size={23} color="#fff" />
        </Pressable>
      </View>

      {/* SEARCH */}
      <View style={styles.search}>
        <Ionicons name="search" size={20} color="#888" />

        <TextInput
          placeholder="Search people..."
          placeholderTextColor="#777"
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={19} color="#888" />
          </Pressable>
        )}
      </View>

      {/* FILTERS */}
      <View style={styles.filters}>
        {filters.map((filter) => {
          const active = activeFilter === filter;

          return (
            <Pressable
              key={filter}
              onPress={() => handleFilterChange(filter)}
              style={[styles.chip, active && styles.activeChip]}>
              {filter === "Nearby" && (
                <Ionicons
                  name="location"
                  size={14}
                  color={active ? "#fff" : "#aaa"}
                />
              )}

              {filter === "Online" && (
                <View
                  style={[styles.onlineDot, active && styles.activeOnlineDot]}
                />
              )}

              {filter === "Verified" && (
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={active ? "#fff" : "#aaa"}
                />
              )}

              {filter === "Discover" && (
                <Ionicons
                  name="compass-outline"
                  size={15}
                  color={active ? "#fff" : "#aaa"}
                />
              )}

              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[styles.chipText, active && styles.activeText]}>
                {filter}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* RESULTS HEADER */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {activeFilter === "Discover"
            ? "Discover people"
            : activeFilter === "Nearby"
              ? "People nearby"
              : activeFilter === "Online"
                ? "Currently online"
                : "Verified members"}
        </Text>

        <Text style={styles.resultsCount}>{filteredPeople.length} people</Text>
      </View>

      {/* PEOPLE GRID */}
      <FlatList
        data={filteredPeople}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadPeople(activeFilter, true)}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
        onEndReached={() => {
          if (!loading && !loadingMore && hasMoreRef.current) {
            loadPeople(activeFilter, false);
          }
        }}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => openUserProfile(item.id)}>
            <Image
              source={{
                uri: item.profileImage || "https://i.pravatar.cc/400?img=12",
              }}
              style={styles.image}
            />

            {item.isOnline && (
              <View style={styles.onlineBadge}>
                <View style={styles.onlineInner} />
              </View>
            )}

            {item.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#3B9EFF" />
              </View>
            )}

            <View style={styles.overlay}>
              <Text style={styles.name} numberOfLines={1}>
                {item.fullName || item.username || "Member"}
                {item.age ? `, ${item.age}` : ""}
              </Text>

              <View style={styles.distanceRow}>
                <Ionicons name="location-outline" size={13} color="#ddd" />

                <Text style={styles.distance} numberOfLines={1}>
                  {item.location || "Location unavailable"}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {loading ? (
              <ActivityIndicator size="large" color={PRIMARY} />
            ) : (
              <>
                <Ionicons name="people-outline" size={42} color="#777" />

                <Text style={styles.emptyTitle}>
                  {errorMessage ? "Something went wrong" : "No people found"}
                </Text>

                <Text style={styles.emptySubtitle}>
                  {errorMessage || "Try another filter or check back later."}
                </Text>

                {errorMessage && (
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => loadPeople(activeFilter, true)}>
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={PRIMARY} />
            </View>
          ) : null
        }
      />

      {/* SORT MODAL */}
      <Modal
        visible={sortVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSortVisible(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSortVisible(false)}>
          <Pressable
            style={styles.sortModal}
            onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Sort people</Text>
                <Text style={styles.modalSubtitle}>
                  Choose how profiles appear
                </Text>
              </View>

              <Pressable
                style={styles.closeButton}
                onPress={() => setSortVisible(false)}>
                <Ionicons name="close" size={21} color="#fff" />
              </Pressable>
            </View>

            {SORT_OPTIONS.map((option) => {
              const selected = sortBy === option;

              return (
                <Pressable
                  key={option}
                  style={[
                    styles.sortOption,
                    selected && styles.selectedSortOption,
                  ]}
                  onPress={() => {
                    setSortBy(option);
                    setSortVisible(false);
                  }}>
                  <Text
                    style={[
                      styles.sortOptionText,
                      selected && styles.selectedSortText,
                    ]}>
                    {option}
                  </Text>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={21}
                      color={PRIMARY}
                    />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.7,
  },

  subtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 4,
  },

  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },

  headerButtonActive: {
    backgroundColor: PRIMARY,
  },

  search: {
    height: 48,
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 17,
  },

  input: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
    fontSize: 14,
  },

  // Every filter receives exactly one quarter of the row.
  filters: {
    flexDirection: "row",
    width: "100%",
    gap: 6,
    marginBottom: 22,
  },

  chip: {
    flex: 1,
    minWidth: 0,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#222",
    paddingHorizontal: 3,
    borderRadius: 12,
  },

  activeChip: {
    backgroundColor: PRIMARY,
  },

  chipText: {
    color: "#aaa",
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },

  activeText: {
    color: "#fff",
    fontWeight: "700",
  },

  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#32D74B",
  },

  activeOnlineDot: {
    backgroundColor: "#fff",
  },

  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  resultsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  resultsCount: {
    color: "#888",
    fontSize: 12,
  },

  listContent: {
    paddingBottom: 30,
    flexGrow: 1,
  },

  columnWrapper: {
    justifyContent: "space-between",
  },

  card: {
    width: "48.5%",
    height: 245,
    borderRadius: 17,
    overflow: "hidden",
    marginBottom: 15,
    backgroundColor: "#1F1F1F",
  },

  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    paddingTop: 30,
    backgroundColor: "rgba(0,0,0,0.48)",
  },

  name: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    gap: 3,
  },

  distance: {
    color: "#ddd",
    fontSize: 11,
    flexShrink: 1,
  },

  onlineBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#32D74B",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },

  onlineInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#fff",
  },

  verifiedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 70,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },

  emptySubtitle: {
    color: "#888",
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },

  retryButton: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 18,
  },

  retryText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },

  // Sorting modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  sortModal: {
    backgroundColor: "#1C1C1C",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#303030",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "800",
  },

  modalSubtitle: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },

  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },

  sortOption: {
    minHeight: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
    borderRadius: 12,
    marginTop: 6,
    backgroundColor: "#252525",
  },

  selectedSortOption: {
    backgroundColor: "rgba(255,79,154,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,79,154,0.35)",
  },

  sortOptionText: {
    color: "#ccc",
    fontSize: 14,
    fontWeight: "600",
  },

  selectedSortText: {
    color: "#fff",
  },
});
