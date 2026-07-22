import { Ionicons } from "@expo/vector-icons";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const people = [
  {
    id: "1",
    name: "Sophia",
    age: 24,
    location: "2 km away",
    image: "https://i.pravatar.cc/300?img=32",
  },
  {
    id: "2",
    name: "Emma",
    age: 26,
    location: "5 km away",
    image: "https://i.pravatar.cc/300?img=47",
  },
  {
    id: "3",
    name: "Grace",
    age: 23,
    location: "8 km away",
    image: "https://i.pravatar.cc/300?img=44",
  },
  {
    id: "4",
    name: "Olivia",
    age: 25,
    location: "4 km away",
    image: "https://i.pravatar.cc/300?img=48",
  },
];

export default function Trending() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Picks Around You</Text>

        <TouchableOpacity>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={people}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <Image source={{ uri: item.image }} style={styles.image} />

            <View style={styles.info}>
              <Text style={styles.name}>
                {item.name}, {item.age}
              </Text>

              <View style={styles.row}>
                <Ionicons name="location-outline" size={13} color="#BDBDBD" />
                <Text style={styles.location}>{item.location}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const PRIMARY = "#FF4F9A";

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  seeAll: {
    color: PRIMARY,
    fontWeight: "600",
  },

  card: {
    width: 125,
    marginRight: 14,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1E1E1E",
  },

  image: {
    width: "100%",
    height: 150,
  },

  info: {
    padding: 10,
  },

  name: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  location: {
    color: "#A0A0A0",
    fontSize: 12,
    marginLeft: 4,
  },
});
