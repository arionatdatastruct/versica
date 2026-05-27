import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';

const menuItems = [
  { icon: '👤', label: 'Persönliche Daten' },
  { icon: '🔔', label: 'Benachrichtigungen' },
  { icon: '🔒', label: 'Datenschutz & Sicherheit' },
  { icon: '❓', label: 'Hilfe & Support' },
  { icon: '📋', label: 'AGB & Datenschutzerklärung' },
];

export default function ProfilScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Abmelden', 'Möchtest du dich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Abmelden', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.email?.charAt(0).toUpperCase() ?? 'U'}
          </Text>
        </View>
        <View>
          <Text style={styles.email}>{user?.email}</Text>
          <Text style={styles.plan}>Kostenlos · Upgrade verfügbar</Text>
        </View>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item, i) => (
          <TouchableOpacity key={item.label} style={[styles.menuItem, i < menuItems.length - 1 && styles.menuItemBorder]} activeOpacity={0.7}>
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
        <Text style={styles.signOutText}>Abmelden</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Versica 1.0.0 · versica.ch</Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    backgroundColor: Colors.surface,
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  plan: {
    fontSize: 12,
    color: Colors.textTertiary,
  },
  menu: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuIcon: {
    fontSize: 18,
    width: 24,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  menuArrow: {
    fontSize: 20,
    color: Colors.textTertiary,
  },
  signOutButton: {
    marginHorizontal: 16,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textTertiary,
  },
});
