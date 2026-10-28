import { saveAs } from 'file-saver';
import { privacyRequest } from './privacyApi';

export async function exportPrivateData() {
  const response = await privacyRequest('/privacy/export');
  saveAs(await response.blob(), 'fitcheck-data.zip');
}
