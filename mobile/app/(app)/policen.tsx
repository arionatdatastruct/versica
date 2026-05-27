import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

type OcrStatus = 'manual' | 'pending' | 'processing' | 'completed' | 'failed';

type Policy = {
  id: string;
  insurer: string | null;
  policy_number: string | null;
  insured_first_name: string | null;
  insured_last_name: string | null;
  total_monthly_premium: number | null;
  ocr_status: OcrStatus;
  created_at: string;
};

const STATUS_LABELS: Record<OcrStatus, string> = {
  manual: 'Manuell',
  pending: 'Wird analysiert',
  processing: 'Wird analysiert',
  completed: 'Ausgelesen',
  failed: 'Fehler',
};

const STATUS_COLORS: Record<OcrStatus, string> = {
  manual: Colors.textTertiary,
  pending: Colors.warning,
  processing: Colors.warning,
  completed: Colors.success,
  failed: Colors.error,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function PolicyCard({ policy, onPress }: { policy: Policy; onPress: () => void }) {
  const title = policy.insurer ?? 'Police';
  const subtitle =
    policy.insured_first_name || policy.insured_last_name
      ? `${policy.insured_first_name ?? ''} ${policy.insured_last_name ?? ''}`.trim()
      : null;
  const status = policy.ocr_status ?? 'manual';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardIcon}>📄</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.cardSubtitle} numberOfLines={1}>{subtitle}</Text>}
        <Text style={styles.cardDate}>{formatDate(policy.created_at)}</Text>
      </View>
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[status] + '1A' }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[status] }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
        {policy.total_monthly_premium != null && (
          <Text style={styles.premium}>
            CHF {policy.total_monthly_premium.toFixed(0)}/Mt.
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function PolicenScreen() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPolicies = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('policies')
      .select('id, insurer, policy_number, insured_first_name, insured_last_name, total_monthly_premium, ocr_status, created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    setPolicies((data as Policy[]) ?? []);
  }, [user]);

  useEffect(() => {
    fetchPolicies().finally(() => setLoading(false));
  }, [fetchPolicies]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchPolicies();
    setRefreshing(false);
  }

  function goToUpload() {
    router.push('/police-upload' as any);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Meine Policen</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Meine Policen</Text>
        <TouchableOpacity style={styles.headerButton} onPress={goToUpload} activeOpacity={0.8}>
          <Text style={styles.headerButtonText}>+ Hochladen</Text>
        </TouchableOpacity>
      </View>

      {policies.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📄</Text>
          <Text style={styles.emptyTitle}>Noch keine Police</Text>
          <Text style={styles.emptyText}>
            Lade deine erste Versicherungspolice hoch — Versica liest sie in Sekunden aus.
          </Text>
          <TouchableOpacity style={styles.uploadButton} onPress={goToUpload} activeOpacity={0.85}>
            <Text style={styles.uploadButtonText}>Police hochladen</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={policies}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            <PolicyCard
              policy={item}
              onPress={() => router.push({ pathname: '/police/[id]' as any, params: { id: item.id } })}
            />
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={onRefresh}
          refreshing={refreshing}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  headerButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
    gap: 12,
  },
  cardLeft: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  premium: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryDark,
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
  uploadButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
