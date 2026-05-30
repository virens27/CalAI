import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyzeFood } from './services/NutritionService';

interface Meal {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: string;
  portion_size: string;
  imageUri: string;
  time: string;
  date: string;
}

const MEALS_KEY = 'calai_meals';
const WATER_KEY = 'calai_water';
const STREAK_KEY = 'calai_streak';
const today = () => new Date().toISOString().split('T')[0];

export default function App() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [water, setWater] = useState(0);
  const [streak, setStreak] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'log'>('home');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      // Load meals
      const storedMeals = await AsyncStorage.getItem(MEALS_KEY);
      if (storedMeals) {
        const allMeals: Meal[] = JSON.parse(storedMeals);
        setMeals(allMeals.filter(m => m.date === today()));
      }
      // Load water
      const waterData = await AsyncStorage.getItem(WATER_KEY + today());
      if (waterData) setWater(parseInt(waterData));
      // Load streak
      const streakData = await AsyncStorage.getItem(STREAK_KEY);
      if (streakData) setStreak(parseInt(streakData));
    } catch (e) { console.log(e); }
  };

  const saveMeals = async (newMeals: Meal[]) => {
    try {
      const stored = await AsyncStorage.getItem(MEALS_KEY);
      const allMeals: Meal[] = stored ? JSON.parse(stored) : [];
      const otherDays = allMeals.filter(m => m.date !== today());
      await AsyncStorage.setItem(MEALS_KEY, JSON.stringify([...otherDays, ...newMeals]));
      // Update streak
      const newStreak = streak + 1;
      setStreak(newStreak);
      await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
    } catch (e) { console.log(e); }
  };

  const addWater = async () => {
    const newWater = water + 1;
    setWater(newWater);
    await AsyncStorage.setItem(WATER_KEY + today(), String(newWater));
  };

  const deleteMeal = async (id: string) => {
    Alert.alert('Delete Meal', 'Remove this meal from your log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = meals.filter(m => m.id !== id);
          setMeals(updated);
          await saveMeals(updated);
          if (selectedMeal?.id === id) setSelectedMeal(null);
        }
      }
    ]);
  };

  const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.protein_g, 0);
  const totalCarbs = meals.reduce((sum, m) => sum + m.carbs_g, 0);
  const totalFat = meals.reduce((sum, m) => sum + m.fat_g, 0);
  const goal = 2000;
  const progress = Math.min(totalCalories / goal, 1);
  const ringColor = progress > 0.9 ? '#FF5252' : progress > 0.7 ? '#FFC107' : '#4CAF50';

  const snapMeal = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0].base64) return;
    setIsAnalyzing(true);
    try {
      const nutrition = await analyzeFood(result.assets[0].base64);
      const newMeal: Meal = {
        id: Date.now().toString(),
        ...nutrition,
        imageUri: result.assets[0].uri,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: today(),
      };
      const updated = [newMeal, ...meals];
      setMeals(updated);
      setSelectedMeal(newMeal);
      await saveMeals(updated);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not analyse food. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CalAI 🍎</Text>
          <View style={styles.headerRight}>
            {streak > 0 && (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>🔥 {streak}</Text>
              </View>
            )}
            <Text style={styles.headerDate}>Today</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'home' && styles.tabActive]}
            onPress={() => setActiveTab('home')}>
            <Text style={[styles.tabText, activeTab === 'home' && styles.tabTextActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'log' && styles.tabActive]}
            onPress={() => setActiveTab('log')}>
            <Text style={[styles.tabText, activeTab === 'log' && styles.tabTextActive]}>Meal Log</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'home' ? (
          <ScrollView style={styles.scroll}>
            {/* Calorie Ring */}
            <View style={styles.ringContainer}>
              <View style={[styles.ring, { borderColor: ringColor }]}>
                <Text style={styles.calorieNumber}>{totalCalories}</Text>
                <Text style={styles.calorieLabel}>kcal eaten</Text>
              </View>
              <Text style={styles.goalText}>
                {goal - totalCalories > 0 ? `${goal - totalCalories} kcal remaining` : 'Goal reached! 🎉'}
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress * 100}%` as any, backgroundColor: ringColor }]} />
            </View>

            {/* Macros Row */}
            <View style={styles.macrosRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totalProtein)}g</Text>
                <Text style={styles.macroLabel}>Protein</Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totalCarbs)}g</Text>
                <Text style={styles.macroLabel}>Carbs</Text>
              </View>
              <View style={styles.macroDivider} />
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(totalFat)}g</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>

            {/* Water Tracker */}
            <View style={styles.waterCard}>
              <View style={styles.waterHeader}>
                <Text style={styles.waterTitle}>💧 Water Intake</Text>
                <Text style={styles.waterCount}>{water} / 8 glasses</Text>
              </View>
              <View style={styles.waterGlasses}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <TouchableOpacity key={i} onPress={addWater}>
                    <Text style={[styles.waterGlass, i < water && styles.waterGlassFilled]}>
                      {i < water ? '💧' : '○'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.waterHint}>Tap a drop to add a glass</Text>
            </View>

            {/* Result Card */}
            {selectedMeal && (
              <View style={styles.resultCard}>
                <Image source={{ uri: selectedMeal.imageUri }} style={styles.resultImage} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{selectedMeal.food_name}</Text>
                  <Text style={styles.resultCalories}>{selectedMeal.calories} kcal</Text>
                  <Text style={styles.resultPortion}>{selectedMeal.portion_size}</Text>
                  <View style={[styles.confidenceBadge,
                  { backgroundColor: selectedMeal.confidence === 'high' ? '#1B5E20' : '#F57F17' }]}>
                    <Text style={styles.confidenceText}>{selectedMeal.confidence} confidence</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedMeal(null)} style={styles.closeBtn}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Recent Meals Preview */}
            <Text style={styles.sectionTitle}>Recent Meals</Text>
            {meals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>📸</Text>
                <Text style={styles.emptyText}>Snap your first meal!</Text>
                <Text style={styles.emptySubtext}>Take a photo of your food and AI will calculate the calories instantly.</Text>
              </View>
            ) : (
              meals.slice(0, 3).map(meal => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.mealItem}
                  onPress={() => setSelectedMeal(meal)}
                  onLongPress={() => deleteMeal(meal.id)}>
                  <Image source={{ uri: meal.imageUri }} style={styles.mealThumb} />
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.food_name}</Text>
                    <Text style={styles.mealMacros}>P: {meal.protein_g}g · C: {meal.carbs_g}g · F: {meal.fat_g}g</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                  <Text style={styles.mealCalories}>{meal.calories}</Text>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 100 }} />
          </ScrollView>
        ) : (
          <ScrollView style={styles.scroll}>
            <Text style={styles.sectionTitle}>All Meals Today</Text>
            {meals.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🍽️</Text>
                <Text style={styles.emptyText}>No meals logged yet</Text>
                <Text style={styles.emptySubtext}>Tap "Snap a Meal" to get started!</Text>
              </View>
            ) : (
              meals.map(meal => (
                <TouchableOpacity
                  key={meal.id}
                  style={styles.mealItem}
                  onPress={() => setSelectedMeal(meal)}
                  onLongPress={() => deleteMeal(meal.id)}>
                  <Image source={{ uri: meal.imageUri }} style={styles.mealThumb} />
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.food_name}</Text>
                    <Text style={styles.mealMacros}>P: {meal.protein_g}g · C: {meal.carbs_g}g · F: {meal.fat_g}g</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                  </View>
                  <Text style={styles.mealCalories}>{meal.calories}</Text>
                </TouchableOpacity>
              ))
            )}
            <Text style={styles.deleteHint}>Long press a meal to delete it</Text>
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Camera Button */}
        <TouchableOpacity style={styles.cameraButton} onPress={snapMeal} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <View style={styles.analyzingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.cameraButtonText}>  Analysing food...</Text>
            </View>
          ) : (
            <Text style={styles.cameraButtonText}>📷  Snap a Meal</Text>
          )}
        </TouchableOpacity>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#ffffff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerDate: { fontSize: 16, color: '#888888' },
  streakBadge: { backgroundColor: '#2a1a00', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#FF6D00' },
  streakText: { fontSize: 13, fontWeight: '700', color: '#FF6D00' },
  tabs: { flexDirection: 'row', marginHorizontal: 24, marginBottom: 8, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: '#4CAF50' },
  tabText: { fontSize: 14, color: '#888888', fontWeight: '500' },
  tabTextActive: { color: '#ffffff', fontWeight: '700' },
  ringContainer: { alignItems: 'center', paddingVertical: 24 },
  ring: { width: 160, height: 160, borderRadius: 80, borderWidth: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  calorieNumber: { fontSize: 42, fontWeight: '700', color: '#ffffff' },
  calorieLabel: { fontSize: 13, color: '#888888', marginTop: 4 },
  goalText: { fontSize: 14, color: '#888888', marginTop: 12 },
  progressBarContainer: { height: 4, backgroundColor: '#1a1a1a', marginHorizontal: 24, borderRadius: 2, marginBottom: 16, overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 2 },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 16, backgroundColor: '#1a1a1a', marginHorizontal: 24, borderRadius: 16, marginBottom: 16 },
  macroItem: { alignItems: 'center', flex: 1 },
  macroDivider: { width: 1, height: 32, backgroundColor: '#333' },
  macroValue: { fontSize: 20, fontWeight: '600', color: '#ffffff' },
  macroLabel: { fontSize: 12, color: '#888888', marginTop: 4 },
  waterCard: { backgroundColor: '#1a1a1a', marginHorizontal: 24, borderRadius: 16, padding: 16, marginBottom: 16 },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  waterTitle: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  waterCount: { fontSize: 13, color: '#4FC3F7' },
  waterGlasses: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  waterGlass: { fontSize: 22, color: '#444' },
  waterGlassFilled: { color: '#4FC3F7' },
  waterHint: { fontSize: 11, color: '#444', textAlign: 'center' },
  resultCard: { flexDirection: 'row', backgroundColor: '#1a1a1a', marginHorizontal: 24, marginBottom: 16, borderRadius: 16, overflow: 'hidden', alignItems: 'center' },
  resultImage: { width: 80, height: 80 },
  resultInfo: { flex: 1, padding: 12 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  resultCalories: { fontSize: 22, fontWeight: '700', color: '#4CAF50', marginTop: 2 },
  resultPortion: { fontSize: 12, color: '#888888', marginTop: 2 },
  confidenceBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  confidenceText: { fontSize: 11, color: '#ffffff', fontWeight: '500' },
  closeBtn: { padding: 12 },
  closeBtnText: { color: '#888888', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginBottom: 12, paddingHorizontal: 24 },
  emptyState: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#ffffff', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 22 },
  mealItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, marginBottom: 8, overflow: 'hidden', marginHorizontal: 24 },
  mealThumb: { width: 60, height: 60 },
  mealInfo: { flex: 1, padding: 10 },
  mealName: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  mealMacros: { fontSize: 12, color: '#888888', marginTop: 2 },
  mealTime: { fontSize: 11, color: '#666', marginTop: 2 },
  mealCalories: { fontSize: 18, fontWeight: '700', color: '#4CAF50', paddingRight: 12 },
  cameraButton: { backgroundColor: '#4CAF50', marginHorizontal: 24, marginBottom: 16, paddingVertical: 18, borderRadius: 16, alignItems: 'center' },
  cameraButtonText: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  analyzingRow: { flexDirection: 'row', alignItems: 'center' },
  deleteHint: { fontSize: 11, color: '#444', textAlign: 'center', marginTop: 8, marginBottom: 16 },
});