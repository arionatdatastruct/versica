import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, Redirect } from 'expo-router';
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
  policy_type: string | null;
  valid_from: string | null;
  valid_to: string | null;
  kvg_model: string | null;
  kvg_franchise: number | null;
  kvg_monthly_premium: number | null;
  kvg_accident_coverage: boolean | null;
  vvg_total_monthly_premium: number | null;
  total_monthly_premium: number | null;
  ocr_status: OcrStatus;
  ocr_error: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<OcrStatus, string> = {
  manual: 'Noch nicht analysiert',
  pending: 'Wird analysiert…',
  processing: 'Wird analysiert…',
  completed: 'Ausgelesen',
  failed: 'Analyse fehlgeschlagen',
};

const STATUS_COLORS: Record<OcrStatus, { bg: string; text: string }> = {
  manual: { bg: Colors.muted, text: Colors.textSecondary },
  pending: { bg: '#FEF3C7', text: Colors.warning },
  processing: { bg: '#FEF3C7', text: Colors.warning },
  completed: { bg: '#DCFCE7', text: Colors.success },
  failed: { bg: '#FEF2F2', text: Colors.error },
};

function formatDate(iso: string | null): string {
  if (!iso) return '–';
  const d = new Date(iso);
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? '–'}</Text>
    </View>
  );
}

export default function PoliceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, user } = useAuth();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  if (!session) return <Redirect href="/(auth)/login" />;

  async function fetchPolicy() {
    if (!user || !id) return;
    const { data } = await supabase
      .from('policies')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .maybeSingle();
    if (data) setPolicy(data as Policy);
    return data as Policy | null;
  }

  useEffect(() => {
    fetchPolicy().finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Poll while OCR is running (max 60 seconds / 20 × 3s intervals)
  useEffect(() => {
    if (!policy) return;
    const isAnalyzing = policy.ocr_status === 'pending' || policy.ocr_status === 'processing';
    if (!isAnalyzing) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollCountRef.current = 0;
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1;
      if (pollCountRef.current >= 20) {
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      const updated = await fetchPolicy();
      if (updated && updated.ocr_status !== 'pending' && updated.ocr_status !== 'processing') {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy?.ocr_status]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Police</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!policy) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Police</Text>
          <View style={styles.backButton} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Police nicht gefunden.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = STATUS_COLORS[policy.ocr_status];
  const isAnalyzing = policy.ocr_status === 'pending' || policy.ocr_status === 'processing';
  const isCompleted = policy.ocr_status === 'completed';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {policy.insurer ?? 'Police'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
          {isAnalyzing && <ActivityIndicator size="small" color={statusStyle.text} style={{ marginRight: 8 }} />}
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {STATUS_LABELS[policy.ocr_status]}
          </Text>
        </View>

        {policy.ocr_status === 'failed' && policy.ocr_error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{policy.ocr_error}</Text>
          </View>
        )}

        {/* Basis-Infos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Versicherung</Text>
          <InfoRow label="Anbieter" value={policy.insurer} />
          <InfoRow label="Policen-Nr." value={policy.policy_number} />
          <InfoRow label="Typ" value={policy.policy_type} />
          <InfoRow
            label="Versicherter"
            value={
              policy.insured_first_name || policy.insured_last_name
                ? `${policy.insured_first_name ?? ''} ${policy.insured_last_name ?? ''}`.trim()
                : null
            }
          />
          <InfoRow label="Gültig ab" value={formatDate(policy.valid_from)} />
          <InfoRow label="Gültig bis" value={formatDate(policy.valid_to)} />
        </View>

        {/* KVG */}
        {(isCompleted || policy.kvg_model != null || policy.kvg_franchise != null) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Grundversicherung (KVG)</Text>
            <InfoRow label="Modell" value={policy.kvg_model} />
            <InfoRow
              label="Franchise"
              value={policy.kvg_franchise != null ? `CHF ${policy.kvg_franchise}` : null}
            />
            <InfoRow
              label="Unfalldeckung"
              value={policy.kvg_accident_coverage != null ? (policy.kvg_accident_coverage ? 'Ja' : 'Nein') : null}
            />
            <InfoRow
              label="Monatsprämie"
              value={policy.kvg_monthly_premium != null ? `CHF ${policy.kvg_monthly_premium.toFixed(2)}` : null}
            />
          </View>
        )}

        {/* Prämien-Zusammenfassung */}
        {policy.total_monthly_premium != null && (
          <View style={styles.premiumCard}>
            <Text style={styles.premiumLabel}>Gesamte Monatsprämie</Text>
            <Text style={styles.premiumAmount}>CHF {policy.total_monthly_premium.toFixed(2)}</Text>
          </View>
        )}

        <Text style={styles.uploadedAt}>Hochgeladen am {formatDate(policy.created_at)}</Text>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 22,
    color: Colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  premiumCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  premiumLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  premiumAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
  },
  uploadedAt: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
