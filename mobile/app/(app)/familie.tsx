import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';

export default function FamilieScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Familie</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>👨‍👩‍👧</Text>
        <Text style={styles.emptyTitle}>Familienmitglieder</Text>
        <Text style={styles.emptyText}>
          Verwalte Policen für deine ganze Familie — Eltern, Partner, Kinder.
        </Text>
        <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
          <Text style={styles.addButtonText}>Mitglied hinzufügen</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  addButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
