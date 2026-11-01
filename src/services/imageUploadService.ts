/**
 * Client-side helper to upload image files to the server.
 * Returns a permanent, accessible server URL (/uploads/...) that works across
 * all devices, school computers, and domains without blowing up localStorage.
 */

export interface ImageUploadResult {
  ok: boolean;
  url?: string;
  fileName?: string;
  sizeBytes?: number;
  error?: string;
}

export async function uploadImageFile(
  file: File,
  prefix: string = 'img'
): Promise<ImageUploadResult> {
  try {
    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return {
        ok: false,
        error: 'A kiválasztott fájl túl nagy (maximum 20 MB megengedett).'
      };
    }

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Kép beolvasási hiba'));
      };
      reader.onerror = () => reject(new Error('Nem sikerült beolvasni a fájlt'));
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base64Data,
        fileName: file.name,
        prefix
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        error: err?.error || `Feltöltési hiba a szerveren (${res.status})`
      };
    }

    const data = await res.json();
    if (data?.ok && data?.url) {
      return {
        ok: true,
        url: data.url,
        fileName: data.fileName,
        sizeBytes: data.sizeBytes
      };
    }

    return {
      ok: false,
      error: data?.error || 'A szerver nem adott vissza kép elérési utat.'
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Hálózati hiba történt a kép feltöltése közben.'
    };
  }
}
