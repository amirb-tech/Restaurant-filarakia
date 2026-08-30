import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Product } from '../types';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.originalPrice!) * 100)
    : 0;

  return (
    <View style={styles.card}>
      <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(17,17,27,0.85)']}
        style={styles.gradient}
      />
      {hasDiscount && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>-{discountPct}%</Text>
        </View>
      )}
      <View style={styles.categoryPill}>
        <Text style={styles.categoryText}>{product.category}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <View style={styles.row}>
          <Text style={styles.price}>€{product.price.toFixed(2)}</Text>
          {hasDiscount && (
            <Text style={styles.originalPrice}>€{product.originalPrice!.toFixed(2)}</Text>
          )}
          <View style={styles.ratingWrap}>
            <Text style={styles.rating}>★ {product.rating.toFixed(1)}</Text>
            <Text style={styles.reviews}>({product.reviews})</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1c1c28',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  badge: {
    position: 'absolute',
    top: 18,
    left: 18,
    backgroundColor: '#F43F5E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  categoryPill: {
    position: 'absolute',
    top: 18,
    right: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c28',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  brand: {
    color: '#C7C7D9',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  price: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  originalPrice: {
    color: '#9A9AB0',
    fontSize: 15,
    textDecorationLine: 'line-through',
  },
  ratingWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginLeft: 'auto',
    gap: 3,
  },
  rating: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
  },
  reviews: {
    color: '#9A9AB0',
    fontSize: 12,
  },
});
