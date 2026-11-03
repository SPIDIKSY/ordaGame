/* =====================================================
   ПРОВЕРКА НИКОВ: нельзя выдавать себя за админа и ругаться
   Ник «раздевается» до сути: регистр, пробелы, _ и -, цифры вместо букв,
   латиница вместо кириллицы и наоборот, повторы букв — всё это не помогает.
   Чтобы запретить новое слово, допиши его в BANNED (латиницей, как «скелет»).
   ===================================================== */

// Кириллица → латиница
const RU = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', л: 'l', м: 'm',
  н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya', і: 'i', ї: 'i', є: 'e'
};
// Цифры вместо букв
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 6: 'b', 7: 't', 8: 'b', 9: 'g', '@': 'a', $: 's' };
// Латинские буквы, похожие на русские: «xyй» читается как «хуй», «BACЯ» как «вася»
const LOOK = { x: 'h', y: 'u', p: 'r', c: 's', h: 'n', b: 'v', u: 'i' };

function skeleton(nick, lookalike) {
  let out = '';
  for (const ch of String(nick).toLowerCase()) {
    if (RU[ch] !== undefined) out += RU[ch];
    else if (LEET[ch] !== undefined) out += LEET[ch];
    else if (ch >= 'a' && ch <= 'z') out += lookalike && LOOK[ch] ? LOOK[ch] : ch;
    // пробелы, _ и - просто выбрасываем
  }
  return out.replace(/(.)\1+/g, '$1'); // «aaadmiiin» → «admin»
}

// Запрещённые слова (как «скелеты»: латиницей, без повторов букв)
const BANNED = [
  // выдавать себя за администрацию
  'admin', 'adm1n', 'administr', 'moder', 'moderator', 'suport', 'poderzhk', 'owner', 'vladelec',
  'sozdatel', 'razrabotchik', 'developer', 'oficial', 'ofical', 'staf', 'sistema', 'system',
  // мат и оскорбления
  'hui', 'huy', 'huj', 'huel', 'hue', 'pizd', 'pisd', 'ebal', 'ebat', 'ebla', 'eblo', 'ebu', 'yeba', 'yob', 'ebn',
  'blya', 'blyad', 'blyat', 'suka', 'suchk', 'pidor', 'pidr', 'pider', 'pidar', 'mudak', 'mudil', 'zalup',
  'gandon', 'shlyuh', 'shluh', 'dolboeb', 'dolbaeb', 'debil', 'gnida', 'chmo', 'fuck', 'shit', 'bitch',
  'nigger', 'nigga', 'faggot', 'whore', 'cunt'
].map((w) => skeleton(w, false));

// null — ник нормальный; иначе — причина отказа
export function badNick(nick) {
  const a = skeleton(nick, false), b = skeleton(nick, true);
  for (const w of BANNED) if (a.includes(w) || b.includes(w)) return 'Такой ник использовать нельзя';
  return null;
}
