import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Category } from '../types';

interface Props {
  categories: Category[];
  selected: Category[];
  onToggle: (category: Category) => void;
}

export default function CategoryFilterBar({ categories, selected, onToggle }: Props) {
  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const active = selected.includes(category);
        return (
          <TouchableOpacity
            key={category}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onToggle(category)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  container: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F1F7',
  },
  chipActive: {
    backgroundColor: '#6D28D9',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#55556B',
  },
  chipTextActive: {
    color: '#fff',
  },
});
