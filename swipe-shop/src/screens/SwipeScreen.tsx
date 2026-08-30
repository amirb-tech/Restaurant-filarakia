import React, { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import CategoryFilterBar from '../components/CategoryFilterBar';
import PriceFilterBar, { PRICE_RANGES, PriceRange } from '../components/PriceFilterBar';
import SwipeDeck from '../components/SwipeDeck';
import { useLiked } from '../context/LikedContext';
import { CATEGORIES, PRODUCTS } from '../data/products';
import { Category, Product } from '../types';

export default function SwipeScreen() {
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>(PRICE_RANGES[0]);
  const { addLiked } = useLiked();

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((p) => {
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(p.category);
      const priceMatch = p.price >= priceRange.min && p.price <= priceRange.max;
      return categoryMatch && priceMatch;
    });
  }, [selectedCategories, priceRange]);

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const handleSwipeRight = (product: Product) => addLiked(product);
  const handleSwipeLeft = (_product: Product) => {};

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>SwipeShop</Text>
        <Text style={styles.tagline}>Σύρε δεξιά ό,τι σ' αρέσει</Text>
      </View>

      <CategoryFilterBar
        categories={CATEGORIES}
        selected={selectedCategories}
        onToggle={toggleCategory}
      />
      <View style={styles.priceBarWrap}>
        <PriceFilterBar selected={priceRange} onSelect={setPriceRange} />
      </View>

      <View style={styles.deckWrap}>
        <SwipeDeck
          key={`${selectedCategories.join(',')}-${priceRange.label}`}
          products={filteredProducts}
          onSwipeRight={handleSwipeRight}
          onSwipeLeft={handleSwipeLeft}
        />
      </View>
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
  logo: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1c1c28',
  },
  tagline: {
    fontSize: 13,
    color: '#8888a0',
    marginTop: 2,
  },
  priceBarWrap: {
    marginTop: 10,
  },
  deckWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
