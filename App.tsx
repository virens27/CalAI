import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CalAI 🍎</Text>
          <Text style={styles.headerDate}>Today</Text>
        </View>

        {/* Calorie Ring */}
        <View style={styles.ringContainer}>
          <View style={styles.ring}>
            <Text style={styles.calorieNumber}>0</Text>
            <Text style={styles.calorieLabel}>kcal eaten</Text>
          </View>
          <Text style={styles.goalText}>Goal: 2,000 kcal</Text>
        </View>

        {/* Macros Row */}
        <View style={styles.macrosRow}>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>0g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>0g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroValue}>0g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        {/* Meals List */}
        <ScrollView style={styles.mealsList}>
          <Text style={styles.mealsTitle}>Today's Meals</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📸</Text>
            <Text style={styles.emptyText}>Snap your first meal!</Text>
            <Text style={styles.emptySubtext}>Take a photo of your food and AI will calculate the calories instantly.</Text>
          </View>
        </ScrollView>

        {/* Camera Button */}
        <TouchableOpacity style={styles.cameraButton}>
          <Text style={styles.cameraButtonText}>📷  Snap a Meal</Text>
        </TouchableOpacity>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerDate: {
    fontSize: 16,
    color: '#888888',
  },
  ringContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  ring: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#888888',
    marginTop: 4,
  },
  goalText: {
    fontSize: 14,
    color: '#888888',
    marginTop: 16,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 24,
    borderRadius: 16,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  macroLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  mealsList: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: 24,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 22,
  },
  cameraButton: {
    backgroundColor: '#4CAF50',
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});