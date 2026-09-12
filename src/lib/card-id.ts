/**
 * Картын hex UID-ийн байтуудыг эсрэгээр эргүүлнэ.
 *
 * Уншигч firmware-ээс хамаараад нэг картыг эсрэг дарааллаар өгдөг тул
 * бүртгэлийн дугаар өгөгдлийн сантайх нь таарахгүй байх тохиолдол гардаг.
 * Засварын цонхон дахь «хөрвүүлэх» товч энэ хоёр хэлбэрийн хооронд сэлгэнэ.
 */
export function swapCardIdBytes(hex: string): string {
  if (!hex) return '';
  const clean = hex.replace(/\s+/g, '');
  const padded = clean.length % 2 !== 0 ? '0' + clean : clean;
  return padded.match(/.{1,2}/g)?.reverse().join('') || padded;
}
