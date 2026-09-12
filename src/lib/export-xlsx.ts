import { toast } from 'sonner';

import { apiClient } from '@/lib/api-client';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Excel файлыг татаж, хөтчийн татах урсгал руу өгнө.
 *
 * `search` / `sortBy` / `sortDirection` зэрэг шүүлтийг дуудагч бэлдэж өгнө —
 * энэ функц зөвхөн татах ажлыг хийнэ. Өмнө нь энэ 90 мөр нь харагдац бүрийн
 * дотор `console.log`-той хамт хуулагдсан байв.
 */
export async function downloadXlsx(
  path: string,
  params: URLSearchParams,
  fileNamePrefix: string
): Promise<void> {
  try {
    const query = params.toString();
    const response = await apiClient.fetchWithAuth(
      query ? `${path}?${query}` : path,
      { method: 'GET', headers: { Accept: XLSX_MIME } }
    );

    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileNamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Excel файл татаж эхэллээ');
  } catch (error) {
    toast.error(
      'Экспорт хийхэд алдаа гарлаа: ' +
        (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}
