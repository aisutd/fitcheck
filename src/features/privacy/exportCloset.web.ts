import { saveAs } from 'file-saver';

// Browser-only file delivery. Screen UI remains entirely React Native.
export async function exportCloset(content: string): Promise<void> {
  saveAs(new Blob([content], { type: 'application/json;charset=utf-8' }), 'fitcheck-closet-demo.json');
}
