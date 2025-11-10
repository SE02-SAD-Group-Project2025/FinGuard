import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

const BalanceCarousel = () => {
  // ---- Demo numbers (wire these to your backend when ready) ----
  const accountBalance = 15420.5;
  const monthlyIncome = 45000;
  const spent = 9579.5;
  const liabilitiesTotal = 12875.0;

  // ---- Cards data ----
  const cards = useMemo(
    () => [
      {
        key: 'balance',
        title: 'Current Balance',
        value: `LKR ${accountBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        subtitle: 'As of today',
        accent: '#22c55e', // green
      },
      {
        key: 'liabilities',
        title: 'Liabilities',
        value: `LKR ${liabilitiesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        subtitle: 'Outstanding total',
        accent: '#ef4444', // red
      },
      {
        key: 'income',
        title: "Month's Income",
        value: `LKR ${monthlyIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        subtitle: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        accent: '#3b82f6', // blue
      },
      {
        key: 'expense',
        title: "Month's Expense",
        value: `LKR ${spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        subtitle: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        accent: '#f59e0b', // amber
      },
    ],
    [accountBalance, liabilitiesTotal, monthlyIncome, spent]
  );

  // ---- Layout & snapping ----
  const SPACING = 16;
  const CARD_WIDTH = Math.round(width * 0.85);
  const ITEM_SIZE = CARD_WIDTH + SPACING;
  const SIDE_PAD = (width - CARD_WIDTH) / 2;

  // ---- State for active dot ----
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);

  const onMomentumEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / ITEM_SIZE);
    setActive(idx);
  };

  return (
    <View style={styles.wrap}>
      {/* Cards */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_SIZE}
        decelerationRate="fast"
        snapToAlignment="center"
        contentContainerStyle={{ paddingHorizontal: SIDE_PAD }}
        onMomentumScrollEnd={onMomentumEnd}
        scrollEventThrottle={16}
      >
        {cards.map((item) => (
          <View key={item.key} style={[styles.card, { width: CARD_WIDTH, marginRight: SPACING }]}>
            <View style={[styles.cardAccent, { backgroundColor: item.accent }]} />
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>{item.title}</Text>
              <TouchableOpacity style={[styles.pillBtn, { backgroundColor: `${item.accent}22` }]}>
                <Text style={[styles.pillText, { color: item.accent }]}>View Details</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardValue}>{item.value}</Text>
            <Text style={styles.cardSub}>{item.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {cards.map((_, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.dot,
              {
                width: active === i ? 22 : 6,
                opacity: active === i ? 1 : 0.35,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardLabel: { color: '#666', fontSize: 16, fontWeight: '600' },
  pillBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  pillText: { fontSize: 12, fontWeight: '700' },
  cardValue: { color: '#000', fontSize: 30, fontWeight: '900', marginBottom: 4 },
  cardSub: { color: '#888', fontSize: 13, fontWeight: '500' },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, marginBottom: 4, gap: 6 },
  dot: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#4ade80',
    marginHorizontal: 3,
  },
});

export default BalanceCarousel;
