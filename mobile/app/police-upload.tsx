import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Redirect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/Colors';

type PickedFile = {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
};

type UploadStep = 'idle' | 'uploading' | 'triggering' | 'done' | 'error';

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-]/g, '_');
}

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PoliceUploadScreen() {
  const { session, user } = useAuth();
  const [pickedFile, setPickedFile] = useState<PickedFile | null>(null);
  const [step, setStep] = useState<UploadStep>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!session) return <Redirect href="/(auth)/login" />;

  async function pickDocument() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPickedFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/pdf', size: asset.size });
  }

  async function pickImage() {
    setError(null);
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Zugriff verweigert', 'Bitte erlaube den Zugriff auf deine Fotos in den Einstellungen.');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop() ?? 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    const name = `police_${Date.now()}.${ext}`;
    setPickedFile({ uri: asset.uri, name, mimeType: mime, size: asset.fileSize });
  }

  async function upload() {
    if (!pickedFile || !user) return;
    setError(null);
    setStep('uploading');

    try {
      // 1. DB-Eintrag anlegen
      const { data: inserted, error: insertErr } = await supabase
        .from('policies')
        .insert({ owner_id: user.id, ocr_status: 'manual', file_mime: pickedFile.mimeType })
        .select('id')
        .single();

      if (insertErr || !inserted) throw new Error(insertErr?.message ?? 'DB-Fehler beim Anlegen der Police');

      const policyId: string = inserted.id;

      // 2. Datei als ArrayBuffer laden und hochladen
      const response = await fetch(pickedFile.uri);
      const arrayBuffer = await response.arrayBuffer();
      const safeName = sanitizeFilename(pickedFile.name);
      const storagePath = `${user.id}/${policyId}/${safeName}`;

      const { error: storageErr } = await supabase.storage
        .from('policy-uploads')
        .upload(storagePath, arrayBuffer, { contentType: pickedFile.mimeType, upsert: false });

      if (storageErr) throw new Error(storageErr.message);

      // 3. DB mit Dateipfad aktualisieren
      const { error: updateErr } = await supabase
        .from('policies')
        .update({ file_path: storagePath, ocr_status: 'pending' })
        .eq('id', policyId);

      if (updateErr) throw new Error(updateErr.message);

      // 4. OCR Edge Function triggern (fire-and-forget)
      setStep('triggering');
      supabase.functions.invoke('process-policy', { body: { policyId } }).catch(() => {});

      setStep('done');
      router.replace('/(app)/policen');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
      setStep('error');
    }
  }

  const isLoading = step === 'uploading' || step === 'triggering';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Police hochladen</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Datei auswählen</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity style={styles.pickerButton} onPress={pickDocument} activeOpacity={0.8} disabled={isLoading}>
            <Text style={styles.pickerIcon}>📄</Text>
            <Text style={styles.pickerLabel}>PDF öffnen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerButton} onPress={pickImage} activeOpacity={0.8} disabled={isLoading}>
            <Text style={styles.pickerIcon}>📷</Text>
            <Text style={styles.pickerLabel}>Foto / Bild</Text>
          </TouchableOpacity>
        </View>

        {pickedFile && (
          <View style={styles.previewCard}>
            <Text style={styles.previewIcon}>{pickedFile.mimeType === 'application/pdf' ? '📑' : '🖼️'}</Text>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName} numberOfLines={2}>{pickedFile.name}</Text>
              <Text style={styles.previewMeta}>
                {pickedFile.mimeType === 'application/pdf' ? 'PDF' : 'Bild'}
                {pickedFile.size ? ` · ${formatBytes(pickedFile.size)}` : ''}
              </Text>
            </View>
            {!isLoading && (
              <TouchableOpacity onPress={() => setPickedFile(null)} activeOpacity={0.7}>
                <Text style={styles.removeIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {isLoading && (
          <View style={styles.progressCard}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.progressText}>
              {step === 'triggering' ? 'Analyse wird gestartet…' : 'Wird hochgeladen…'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadButton, (!pickedFile || isLoading) && styles.uploadButtonDisabled]}
          onPress={upload}
          activeOpacity={0.85}
          disabled={!pickedFile || isLoading}
        >
          <Text style={styles.uploadButtonText}>Police hochladen</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Versica liest deine Police automatisch aus — KVG-Modell, Franchise und Prämien werden erkannt.
        </Text>
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
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  pickerButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  previewIcon: {
    fontSize: 28,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  previewMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  removeIcon: {
    fontSize: 16,
    color: Colors.textSecondary,
    padding: 4,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    lineHeight: 18,
  },
  progressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  uploadButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  uploadButtonDisabled: {
    backgroundColor: Colors.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  uploadButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
