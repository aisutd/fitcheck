import { privacyRequest } from './privacyApi';
import { exportCloset } from '../exportCloset';

export async function exportPrivateData() {
  const response = await privacyRequest('/privacy/export?format=json');
  await exportCloset(JSON.stringify(await response.json(), null, 2));
}
