import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { buildReportData, type ReportData } from '@/repositories/reportRepo';
import { buildReportHtml, type ReportSection } from '@/lib/reportHtml';

/**
 * Build the report for the given audience, render it to a PDF file and open the
 * share sheet. Returns the file URI. Requires explicit user action (a button).
 */
export async function exportReport(audience: 'nutritionist' | 'coach', included?: readonly ReportSection[], snapshot?: ReportData): Promise<string> {
  const data = snapshot ?? buildReportData(audience);
  const html = buildReportHtml(data, included);
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: audience === 'coach' ? 'Share coach report' : 'Share nutritionist report',
      UTI: 'com.adobe.pdf',
    });
  } else {
    // No share sheet on this device: say where the file went rather than
    // returning silently as if nothing happened.
    Alert.alert('Report generated', `Saved to:
${uri}`);
  }
  return uri;
}
