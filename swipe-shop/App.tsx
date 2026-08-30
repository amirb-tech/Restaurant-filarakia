import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LikedProvider, useLiked } from './src/context/LikedContext';
import LikedScreen from './src/screens/LikedScreen';
import SwipeScreen from './src/screens/SwipeScreen';

type Tab = 'swipe' | 'liked';

function TabBar({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const { liked } = useLiked();
  return (
    <SafeAreaView style={styles.tabBarSafe}>
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onChange('swipe')}>
          <Text style={[styles.tabIcon, tab === 'swipe' && styles.tabIconActive]}>🔥</Text>
          <Text style={[styles.tabLabel, tab === 'swipe' && styles.tabLabelActive]}>Ανακάλυψη</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => onChange('liked')}>
          <View>
            <Text style={[styles.tabIcon, tab === 'liked' && styles.tabIconActive]}>💜</Text>
            {liked.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{liked.length}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, tab === 'liked' && styles.tabLabelActive]}>Αγαπημένα</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Root() {
  const [tab, setTab] = useState<Tab>('swipe');
  return (
    <View style={styles.flex}>
      <View style={styles.flex}>{tab === 'swipe' ? <SwipeScreen /> : <LikedScreen />}</View>
      <TabBar tab={tab} onChange={setTab} />
      <StatusBar style="dark" />
    </View>
  );
}

export default function App() {
  return (
    <LikedProvider>
      <Root />
    </LikedProvider>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabBarSafe: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#EFEFF5',
  },
  tabBar: {
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    color: '#8888a0',
    marginTop: 2,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#1c1c28',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#F43F5E',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
