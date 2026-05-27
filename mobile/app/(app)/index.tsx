import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

const quickActions = [
  { icon: '📤', label: 'Police hochladen', sublabel: 'PDF, Foto oder Scan', route: '/police-upload' },
  { icon: '💬', label: 'Versica fragen', sublabel: 'KI-Beratung', route: null },
  { icon: '⚡', label: 'Optimieren', sublabel: 'Kosten senken', route: null },
  { icon: '📬', label: 'Kündigung', sublabel: 'Wir erledigen das', route: null },
];

export default function DashboardScreen() {
  const { user } = useAuth();
  const firstName = user?.email?.split('@')[0] ?? 'Willkommen';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.greeting}>Hallo, {firstName} 👋</Text>
            <Text style={styles.subtitle}>Was kann Versica für dich tun?</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🔍</Text>
          <Text style={styles.heroTitle}>Deine Krankenkasse, endlich verständlich.</Text>
          <Text style={styles.heroText}>
            Lade deine Police hoch und frag Versica alles — in Sekunden.
          </Text>
          <TouchableOpacity style={styles.heroButton} activeOpacity={0.85} onPress={() => router.push('/police-upload' as any)}>
            <Text style={styles.heroButtonText}>Police hochladen →</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Schnellzugriff</Text>
        <View style={styles.grid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.gridCard}
              activeOpacity={0.8}
              onPress={() => action.route && router.push(action.route as any)}
            >
              <Text style={styles.gridIcon}>{action.icon}</Text>
              <Text style={styles.gridLabel}>{action.label}</Text>
              <Text style={styles.gridSublabel}>{action.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.trustBanner}>
          <Text style={styles.trustText}>🛡️ FINMA-registriert · 🔒 revDSG · 🇨🇭 Schweizer Hosting</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 28,
  },
  heroEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
    lineHeight: 24,
  },
  heroText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 18,
  },
  heroButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 28,
  },
  gridCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  gridSublabel: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  trustBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  trustText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '500',
    textAlign: 'center',
  },
});
