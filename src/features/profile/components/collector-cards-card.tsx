'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent
} from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  IconBan,
  IconLoader2,
  IconPlus,
  IconTrash,
  IconUserCheck
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';

import {
  ClientCardSuggestion,
  CollectorCard,
  EMPTY_FORM,
  MIN_QUERY_LENGTH,
  displayCardNumber,
  matchesTypedNumber,
  normalizeCardValue
} from './collector/collector-model';
import { CollectorCardsTable } from './collector/collector-cards-table';

/**
 * Хогийн сав хоослогч (жолооч)-ийн картын бүртгэл.
 *
 * Энэ картыг сав дээр уншуулахад тухайн савны "Хоослох түүх"-д мөр үүснэ, тиймээс
 * бүртгэх эрхийг зөвхөн супер админд өгсөн — profile хуудсанд байрлана.
 */
export function CollectorCardsCard() {
  const [cards, setCards] = useState<CollectorCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CollectorCard | null>(
    null
  );

  // Картын дугаар бичих үеийн санал болголт: биетээр байхгүй картын дугаарыг
  // гараар бичихээр буруу бичих эрсдэлтэй тул бүртгэлээс сонгуулна.
  const [suggestions, setSuggestions] = useState<ClientCardSuggestion[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selectedClient, setSelectedClient] =
    useState<ClientCardSuggestion | null>(null);
  const debouncedCardId = useDebounce(form.cardId, 300);
  // Хайлтын хариу бичсэнээс хоцорч ирвэл хуучин жагсаалтыг бүү тавь.
  const searchSeq = useRef(0);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.fetchWithAuth(
        '/api/users/collector-cards'
      );
      if (!response.ok) {
        throw new Error('Картын жагсаалт татахад алдаа гарлаа');
      }
      setCards(await response.json());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Картын жагсаалт татахад алдаа гарлаа'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  // Backend-ийн алдааны бичвэрийг (давхардсан карт, буруу формат) шууд харуулна.
  const readError = async (response: Response, fallback: string) => {
    const raw = await response.text();
    try {
      const parsed = JSON.parse(raw);
      return parsed.message || parsed.error || fallback;
    } catch {
      return raw || fallback;
    }
  };

  const searchClientCards = useCallback(
    async (query: string): Promise<ClientCardSuggestion[]> => {
      const response = await apiClient.fetchWithAuth(
        `/api/users/collector-cards/client-suggestions?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error(await readError(response, 'Карт хайхад алдаа гарлаа'));
      }
      return response.json();
    },
    []
  );

  // Бичсэн дугаараар бүртгэлээс хайх. Карт сонгогдсон байвал хайхгүй: дугаарыг
  // гараар засмагц сонголт хүчингүй болдог тул `selectedClient` байна гэдэг нь
  // нүдэн дэх утга сонголтоос ирсэн гэсэн үг — дахин хайвал сонгосны дараа
  // жагсаалт өөрөө нээгдэж, сонголт алдагдсан мэт харагдана.
  useEffect(() => {
    const query = debouncedCardId.trim();
    if (selectedClient || query.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const seq = ++searchSeq.current;
    setIsSearching(true);
    searchClientCards(query)
      .then((rows) => {
        if (seq !== searchSeq.current) return;
        setSuggestions(rows);
        setHighlight(0);
        setIsSuggestOpen(true);
      })
      .catch(() => {
        // Хайлт бүтэлгүйтвэл гараар бичих боломж хэвээр — алдааны мэдэгдлээр
        // бөглөх явцыг тасалдуулах шаардлагагүй.
        if (seq !== searchSeq.current) return;
        setSuggestions([]);
      })
      .finally(() => {
        if (seq === searchSeq.current) setIsSearching(false);
      });
  }, [debouncedCardId, selectedClient, searchClientCards]);

  const selectSuggestion = (suggestion: ClientCardSuggestion) => {
    setSelectedClient(suggestion);
    setForm((current) => ({
      ...current,
      cardId: displayCardNumber(suggestion),
      // Бүртгэл дээрх нэр, утсыг өвлүүлнэ — гараар оруулсныг дарж бичихгүй.
      name: current.name.trim() || suggestion.name || '',
      phone: current.phone.trim() || suggestion.phone || ''
    }));
    setIsSuggestOpen(false);
    setSuggestions([]);
  };

  const handleCardIdChange = (value: string) => {
    setForm((current) => ({ ...current, cardId: value }));
    // Дугаарыг гараар засмагц сонголт хүчингүй: сонгосон картанд нь биш өөр
    // картад бүртгэгдэх эрсдэлтэй.
    setSelectedClient(null);
    setIsSuggestOpen(value.trim().length >= MIN_QUERY_LENGTH);
  };

  const handleCardIdKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isSuggestOpen || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlight((index) => (index + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlight(
        (index) => (index - 1 + suggestions.length) % suggestions.length
      );
    } else if (event.key === 'Enter') {
      event.preventDefault();
      selectSuggestion(suggestions[highlight]);
    } else if (event.key === 'Escape') {
      setIsSuggestOpen(false);
    }
  };

  /**
   * Бичсэн дугаар бүртгэл дээрх картынх мөн эсэхийг бүртгэхийн өмнө шалгана.
   *
   * Оператор жагсаалтаас сонгохгүйгээр бүтэн дугаараа буулгаад шууд бүртгэх нь
   * элбэг. Тэр карт иргэний бүртгэлтэй бол энгийн бүртгэл нь "аль хэдийн
   * бүртгэлтэй" гэж татгалзах тул сонгосонтой адилаар нь өөрөө оноож өгнө.
   */
  const resolveTypedCard = async (cardId: string) => {
    if (selectedClient) return selectedClient;
    try {
      const rows = await searchClientCards(cardId);
      return rows.find((row) => matchesTypedNumber(row, cardId)) ?? null;
    } catch {
      return null;
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.cardId.trim()) {
      toast.error('Нэр болон картын дугаарыг бөглөнө үү');
      return;
    }

    setIsSaving(true);
    try {
      const client = await resolveTypedCard(form.cardId.trim());
      const response = client
        ? await apiClient.fetchWithAuth(
            '/api/users/collector-cards/from-client',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clientId: client.clientId,
                name: form.name.trim(),
                phone: form.phone.trim() || null,
                vehicleNumber: form.vehicleNumber.trim() || null
              })
            }
          )
        : await apiClient.fetchWithAuth('/api/users/collector-cards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: form.name.trim(),
              cardId: form.cardId.trim(),
              phone: form.phone.trim() || null,
              vehicleNumber: form.vehicleNumber.trim() || null
            })
          });

      if (!response.ok) {
        throw new Error(
          await readError(response, 'Карт бүртгэхэд алдаа гарлаа')
        );
      }

      toast.success('Хоослогчийн карт бүртгэгдлээ');
      setForm(EMPTY_FORM);
      setSelectedClient(null);
      setSuggestions([]);
      setIsSuggestOpen(false);
      fetchCards();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Карт бүртгэхэд алдаа гарлаа'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (card: CollectorCard) => {
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/users/collector-cards/${card.id}/status?isActive=${!card.active}`,
        { method: 'PUT' }
      );
      if (!response.ok) {
        throw new Error(
          await readError(response, 'Төлөв өөрчлөхөд алдаа гарлаа')
        );
      }
      toast.success(card.active ? 'Карт хүчингүй болголоо' : 'Карт идэвхжлээ');
      fetchCards();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Төлөв өөрчлөхөд алдаа гарлаа'
      );
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      const response = await apiClient.fetchWithAuth(
        `/api/users/collector-cards/${pendingDelete.id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) {
        throw new Error(
          await readError(response, 'Карт устгахад алдаа гарлаа')
        );
      }
      toast.success('Карт устгагдлаа');
      setPendingDelete(null);
      fetchCards();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Карт устгахад алдаа гарлаа'
      );
    }
  };

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString('mn-MN') : '-';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Хогийн сав хоослогчийн карт</CardTitle>
        <CardDescription>
          Хог ачигч жолооч савыг хоослоод энэ картаа уншуулахад тухайн савны
          &quot;Хоослох түүх&quot;-д бүртгэгдэнэ. Картын дугаарыг бичихэд
          бүртгэлтэй картуудаас хайж санал болгоно — жагсаалтаас картаа сонгоод
          нэр, утас, машины дугаарыг нь бүртгэнэ. Дугаарыг уншигч дээр гарах
          аравтын тоогоор (жишээ нь 964487466) ч, 16-тын дугаараар (397CE92A) ч
          хайж болно.
        </CardDescription>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-5'>
          <div className='space-y-2'>
            <Label htmlFor='collector-name'>Нэр *</Label>
            <Input
              id='collector-name'
              placeholder='Ж: Б.Болд'
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className='relative space-y-2'>
            <Label htmlFor='collector-card-id'>Картын дугаар *</Label>
            <Input
              id='collector-card-id'
              placeholder='964487466'
              className='font-mono'
              autoComplete='off'
              value={form.cardId}
              onChange={(e) => handleCardIdChange(e.target.value)}
              onKeyDown={handleCardIdKeyDown}
              onFocus={() => suggestions.length > 0 && setIsSuggestOpen(true)}
              // Жагсаалтаас сонгох үед blur нь сонголтоос түрүүлж ажиллах тул
              // хаахыг хойшлуулна (сонголт нь onMouseDown дээр ажиллана).
              onBlur={() =>
                window.setTimeout(() => setIsSuggestOpen(false), 120)
              }
            />
            {isSearching && (
              <IconLoader2 className='text-muted-foreground absolute top-8 right-2 h-4 w-4 animate-spin' />
            )}
            {isSuggestOpen && suggestions.length > 0 && (
              <div className='bg-popover absolute top-full right-0 left-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-md border shadow-md'>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.clientId}
                    type='button'
                    className={cn(
                      'block w-full px-3 py-2 text-left text-sm',
                      index === highlight && 'bg-accent'
                    )}
                    onMouseEnter={() => setHighlight(index)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectSuggestion(suggestion);
                    }}
                  >
                    <div className='font-mono'>
                      {displayCardNumber(suggestion)}
                    </div>
                    <div className='text-muted-foreground truncate text-xs'>
                      {[
                        suggestion.name,
                        suggestion.phone,
                        suggestion.address,
                        // Бүртгэл дээр идэвхгүй карт нь гээгдсэн/буцаагдсан
                        // байж болзошгүй — сонгохын өмнө мэдэгдэнэ.
                        suggestion.active ? null : 'бүртгэл дээр идэвхгүй'
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Нэргүй бүртгэл'}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {isSuggestOpen &&
              !isSearching &&
              suggestions.length === 0 &&
              form.cardId.trim().length >= MIN_QUERY_LENGTH &&
              // Хайлт бичсэн утгыг гүйцээгүй байхад "олдсонгүй" гэж бүү үзүүл.
              debouncedCardId.trim() === form.cardId.trim() && (
                <div className='bg-popover text-muted-foreground absolute top-full right-0 left-0 z-50 mt-1 rounded-md border px-3 py-2 text-xs shadow-md'>
                  Бүртгэлээс олдсонгүй — дугаарыг гараар бүртгэж болно.
                </div>
              )}
          </div>
          <div className='space-y-2'>
            <Label htmlFor='collector-phone'>Утас</Label>
            <Input
              id='collector-phone'
              placeholder='99112233'
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='collector-vehicle'>Машины дугаар</Label>
            <Input
              id='collector-vehicle'
              placeholder='1234 УБА'
              value={form.vehicleNumber}
              onChange={(e) =>
                setForm({ ...form, vehicleNumber: e.target.value })
              }
            />
          </div>
          <Button
            onClick={handleCreate}
            disabled={isSaving || !form.name || !form.cardId}
          >
            <IconPlus className='mr-2 h-4 w-4' />
            {isSaving ? 'Бүртгэж байна...' : 'Бүртгэх'}
          </Button>
        </div>

        {selectedClient && (
          <div className='bg-muted/50 rounded-md border p-3 text-sm'>
            <span className='font-medium'>Бүртгэлээс сонгосон карт:</span>{' '}
            <span className='font-mono'>
              {displayCardNumber(selectedClient)}
            </span>
            {selectedClient.name ? ` · ${selectedClient.name}` : ''}
            {selectedClient.address ? ` · ${selectedClient.address}` : ''}
            <div className='text-muted-foreground mt-1 text-xs'>
              Бүртгэсний дараа энэ карт иргэний бүртгэлээс идэвхгүй болно — нэг
              карт зэрэг иргэнийх ба хоослогчийнх байж болохгүй. Уншилт нь
              цаашид хог хаялт биш, савны хоослолт болж бүртгэгдэнэ.
            </div>
          </div>
        )}

        <CollectorCardsTable
          cards={cards}
          isLoading={isLoading}
          onToggleActive={toggleActive}
          onDelete={setPendingDelete}
        />
      </CardContent>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Картыг устгах уу?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{pendingDelete?.name}&quot;-ийн карт устгагдана. Түүхийг
              хадгалахын тулд устгахын оронд &quot;Хүчингүй болгох&quot;
              сонголтыг ашиглаж болно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Устгах</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
