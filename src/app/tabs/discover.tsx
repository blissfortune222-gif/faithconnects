import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const people = [
  {
    id: "1",
    name: "Sophia",
    age: 22,
    distance: "1.2 km",
    image: "https://i.pravatar.cc/400?img=32",
    online: true,
  },
  {
    id: "2",
    name: "Emma",
    age: 24,
    distance: "2.8 km",
    image: "https://i.pravatar.cc/400?img=47",
    online: true,
  },
  {
    id: "3",
    name: "Olivia",
    age: 23,
    distance: "3.1 km",
    image: "https://i.pravatar.cc/400?img=48",
    online: false,
  },
  {
    id: "4",
    name: "Grace",
    age: 25,
    distance: "4.7 km",
    image: "https://i.pravatar.cc/400?img=44",
    online: true,
  },
  {
    id: "5",
    name: "Sarah",
    age: 21,
    distance: "5.4 km",
    image: "https://i.pravatar.cc/400?img=20",
    online: false,
  },
  {
    id: "6",
    name: "Ella",
    age: 22,
    distance: "6.3 km",
    image: "https://i.pravatar.cc/400?img=19",
    online: true,
  },
];

export default function Discover() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Discover</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={20} color="#888" />
        <TextInput
          placeholder="Search people..."
          placeholderTextColor="#777"
          style={styles.input}
        />
      </View>

      <View style={styles.filters}>
        <View style={styles.activeChip}>
          <Text style={styles.activeText}>Nearby</Text>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipText}>Online</Text>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipText}>New</Text>
        </View>

        <View style={styles.chip}>
          <Text style={styles.chipText}>Verified</Text>
        </View>
      </View>

      <FlatList
        data={people}
        numColumns={2}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />

            {item.online && <View style={styles.online} />}

            <View style={styles.overlay}>
              <Text style={styles.name}>
                {item.name}, {item.age}
              </Text>

              <Text style={styles.distance}>📍 {item.distance} away</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const PRIMARY = "#FF4F9A";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    paddingHorizontal: 18,
    paddingTop: 10,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 18,
  },

  search: {
    height: 50,
    backgroundColor: "#1E1E1E",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  input: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
    fontSize: 15,
  },

  filters: {
    flexDirection: "row",
    marginBottom: 20,
  },

  activeChip: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },

  activeText: {
    color: "#fff",
    fontWeight: "700",
  },

  chip: {
    backgroundColor: "#222",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },

  chipText: {
    color: "#aaa",
    fontWeight: "600",
  },

  card: {
    width: "48%",
    height: 250,
    borderRadius: 22,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#1F1F1F",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  name: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },

  distance: {
    color: "#ddd",
    marginTop: 4,
    fontSize: 13,
  },

  online: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#32D74B",
    borderWidth: 2,
    borderColor: "#fff",
  },
});
