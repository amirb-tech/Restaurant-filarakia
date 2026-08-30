import React from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLiked } from '../context/LikedContext';
import { Product } from '../types';

export default function LikedScreen() {
  const { liked, removeLiked } = useLiked();

  const renderItem = ({ item }: { item: Product }) => (
    <View style={styles.row}>
      <Image source={{ uri: item.image }} style={styles.thumb} />
      <View style={styles.rowInfo}>
        <Text style={styles.brand}>{item.brand}</Text>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.price}>€{item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.removeBtn} onPress={() => removeLiked(item.id)}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title2}>Αγαπημένα</Text>
        <Text style={styles.subtitle}>{liked.length} προϊόντα</Text>
      </View>
      {liked.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💜</Text>
          <Text style={styles.emptyTitle}>Δεν έχεις αγαπημένα ακόμα</Text>
          <Text style={styles.emptySubtitle}>Σύρε δεξιά προϊόντα που σου αρέσουν.</Text>
        </View>
      ) : (
        <FlatList
          data={liked}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title2: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1c1c28',
  },
  subtitle: {
    fontSize: 13,
    color: '#8888a0',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8FB',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  rowInfo: {
    flex: 1,
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8888a0',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1c1c28',
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6D28D9',
    marginTop: 4,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  removeText: {
    color: '#F43F5E',
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1c28',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8888a0',
    textAlign: 'center',
  },
});
