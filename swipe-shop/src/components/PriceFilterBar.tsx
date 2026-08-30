import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';

export interface PriceRange {
  label: string;
  min: number;
  max: number;
}

export const PRICE_RANGES: PriceRange[] = [
  { label: 'Όλες οι τιμές', min: 0, max: Infinity },
  { label: 'Έως €20', min: 0, max: 20 },
  { label: '€20 - €50', min: 20, max: 50 },
  { label: '€50 - €100', min: 50, max: 100 },
  { label: '€100+', min: 100, max: Infinity },
];

interface Props {
  selected: PriceRange;
  onSelect: (range: PriceRange) => void;
}

export default function PriceFilterBar({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {PRICE_RANGES.map((range) => {
        const active = range.label === selected.label;
        return (
          <TouchableOpacity
            key={range.label}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(range)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{range.label}</Text>
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E3E3EE',
  },
  chipActive: {
    backgroundColor: '#1c1c28',
    borderColor: '#1c1c28',
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#55556B',
  },
  chipTextActive: {
    color: '#fff',
  },
});
