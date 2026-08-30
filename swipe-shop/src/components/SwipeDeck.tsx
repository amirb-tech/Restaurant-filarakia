import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Product } from '../types';
import ProductCard from './ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_OUT_DURATION = 220;
const VISIBLE_STACK = 3;

interface Props {
  products: Product[];
  onSwipeRight: (product: Product) => void;
  onSwipeLeft: (product: Product) => void;
}

export default function SwipeDeck({ products, onSwipeRight, onSwipeLeft }: Props) {
  const [index, setIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;

  useMemo(() => {
    position.setValue({ x: 0, y: 0 });
    setIndex(0);
  }, [products]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 6 || Math.abs(gesture.dy) > 6,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const forceSwipe = (direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'left' | 'right') => {
    const product = products[index];
    if (product) {
      if (direction === 'right') onSwipeRight(product);
      else onSwipeLeft(product);
    }
    position.setValue({ x: 0, y: 0 });
    setIndex((prev) => prev + 1);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: false,
    }).start();
  };

  const getCardStyle = () => {
    const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
    });
    return {
      ...position.getLayout(),
      transform: [{ rotate }],
    };
  };

  if (index >= products.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyEmoji}>🛍️</Text>
        <Text style={styles.emptyTitle}>Τέλος προϊόντων</Text>
        <Text style={styles.emptySubtitle}>Δοκίμασε διαφορετικά φίλτρα για να δεις κι άλλα.</Text>
      </View>
    );
  }

  return (
    <View style={styles.deckContainer}>
      <View style={styles.stackArea}>
      {products
        .slice(index, index + VISIBLE_STACK)
        .map((product, i) => {
          if (i === 0) {
            return (
              <Animated.View
                key={product.id}
                style={[styles.cardWrap, getCardStyle()]}
                {...panResponder.panHandlers}
              >
                <ProductCard product={product} />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.stamp,
                    styles.likeStamp,
                    { opacity: position.x.interpolate({ inputRange: [10, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' }) },
                  ]}
                >
                  <Text style={styles.likeStampText}>LIKE</Text>
                </Animated.View>
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.stamp,
                    styles.nopeStamp,
                    { opacity: position.x.interpolate({ inputRange: [-SWIPE_THRESHOLD, -10], outputRange: [1, 0], extrapolate: 'clamp' }) },
                  ]}
                >
                  <Text style={styles.nopeStampText}>NOPE</Text>
                </Animated.View>
              </Animated.View>
            );
          }
          return (
            <Animated.View
              key={product.id}
              style={[
                styles.cardWrap,
                {
                  top: i * 10,
                  transform: [{ scale: 1 - i * 0.04 }],
                },
              ]}
            >
              <ProductCard product={product} />
            </Animated.View>
          );
        })
        .reverse()}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.dislikeBtn]}
          onPress={() => forceSwipe('left')}
        >
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.likeBtn]}
          onPress={() => forceSwipe('right')}
        >
          <Text style={styles.actionIcon}>♥</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  deckContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stackArea: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  cardWrap: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#1c1c28',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#8888a0',
    textAlign: 'center',
  },
  stamp: {
    position: 'absolute',
    top: 40,
    borderWidth: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  likeStamp: {
    left: 24,
    borderColor: '#22C55E',
    transform: [{ rotate: '-18deg' }],
  },
  likeStampText: {
    color: '#22C55E',
    fontSize: 30,
    fontWeight: '800',
  },
  nopeStamp: {
    right: 24,
    borderColor: '#F43F5E',
    transform: [{ rotate: '18deg' }],
  },
  nopeStampText: {
    color: '#F43F5E',
    fontSize: 30,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 16,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  dislikeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#F43F5E',
  },
  likeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  actionIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1c1c28',
  },
});
