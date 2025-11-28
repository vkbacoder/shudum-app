import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function DateStrip({ selectedDate, onDateSelect, currentMonth }) {
  const { theme } = useTheme();
  const [dates, setDates] = useState([]);

  useEffect(() => {
    if (!currentMonth) return;
    
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();

    for (let i = 1; i <= numDays; i++) {
      const date = new Date(year, month, i);
      days.push({
        fullDate: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
      });
    }
    setDates(days);
  }, [currentMonth]);

  const renderItem = ({ item }) => {
    const isSelected = item.fullDate === selectedDate;
    return (
      <TouchableOpacity
        style={[styles.dateItem, { backgroundColor: theme.card, borderColor: theme.border }, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
        onPress={() => onDateSelect(item.fullDate)}
      >
        <Text style={[styles.dayName, { color: theme.subText }, isSelected && styles.selectedText]}>{item.dayName}</Text>
        <Text style={[styles.dayNumber, { color: theme.text }, isSelected && styles.selectedText]}>{item.dayNumber}</Text>
        {isSelected && <View style={[styles.dot, { backgroundColor: theme.card }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={dates}
        renderItem={renderItem}
        keyExtractor={item => item.fullDate}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  dateItem: {
    width: 60,
    height: 80,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
  },
  dayName: {
    fontSize: 14,
    marginBottom: 5,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  selectedText: {
    color: '#FFFFFF',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 5,
  },
});
