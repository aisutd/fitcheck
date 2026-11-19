/** Expo 57 native URI multipart parts use XMLHttpRequest's native encoder. */
export function postMultipart(url: string, form: FormData, signal: AbortSignal): Promise<{ ok: boolean; json: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const abort = () => request.abort();
    const cleanup = () => signal.removeEventListener('abort', abort);
    request.open('POST', url); request.timeout = 65000;
    request.onload = () => {
      cleanup();
      resolve({ ok: request.status >= 200 && request.status < 300, json: async () => JSON.parse(request.responseText) });
    };
    request.onerror = () => { cleanup(); reject(new Error('Cannot reach the analysis service.')); };
    request.ontimeout = () => { cleanup(); reject(new Error('Analysis timed out.')); };
    request.onabort = () => { cleanup(); reject(new Error('Analysis canceled or timed out.')); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { cleanup(); reject(new Error('Analysis canceled.')); return; }
    request.send(form);
  });
}
