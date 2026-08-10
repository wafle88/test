const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const VOWEL_COMBINE = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ',
};
const VOWEL_SPLIT = Object.fromEntries(
  Object.entries(VOWEL_COMBINE).map(([k, v]) => [v, k[0]]),
);

const CONS_COMBINE = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ',
  'ㅂㅅ': 'ㅄ',
};
const CONS_SPLIT = Object.fromEntries(
  Object.entries(CONS_COMBINE).map(([k, v]) => [v, [k[0], k[1]]]),
);

function isVowel(c) {
  return JUNG.includes(c);
}
function isConsonant(c) {
  return CHO.includes(c);
}
function assemble(cho, jung, jong = '') {
  const ci = CHO.indexOf(cho);
  const ji = JUNG.indexOf(jung);
  const gi = JONG.indexOf(jong || '');
  if (ci < 0 || ji < 0 || gi < 0) return (cho || '') + (jung || '') + (jong || '');
  return String.fromCharCode(0xAC00 + ci * 588 + ji * 28 + gi);
}

export class HangulComposer {
  constructor() {
    this.committed = '';
    this.cho = null;
    this.jung = null;
    this.jong = null;
  }

  _reset() {
    this.cho = null;
    this.jung = null;
    this.jong = null;
  }

  get composing() {
    if (this.cho != null && this.jung != null) {
      return assemble(this.cho, this.jung, this.jong ?? '');
    }
    return (this.cho ?? '') + (this.jung ?? '') + (this.jong ?? '');
  }

  get text() {
    return this.committed + this.composing;
  }

  commit() {
    if (this.cho != null || this.jung != null || this.jong != null) {
      this.committed += this.composing;
      this._reset();
    }
  }

  input(char) {
    if (isVowel(char)) {
      this._inputVowel(char);
    } else if (isConsonant(char)) {
      this._inputConsonant(char);
    } else {
      this.commit();
      this.committed += char;
    }
  }

  _inputConsonant(c) {
    if (this.cho == null) {
      this.cho = c;
      return;
    }
    if (this.jung == null) {
      this.committed += this.cho;
      this.cho = c;
      return;
    }
    if (this.jong == null) {
      if (JONG.includes(c)) {
        this.jong = c;
      } else {
        this.commit();
        this.cho = c;
      }
      return;
    }
    const combined = CONS_COMBINE[this.jong + c];
    if (combined && JONG.includes(combined)) {
      this.jong = combined;
    } else {
      this.commit();
      this.cho = c;
    }
  }

  _inputVowel(v) {
    if (this.cho == null) {
      this.commit();
      this.committed += v;
      return;
    }
    if (this.jung == null) {
      this.jung = v;
      return;
    }
    if (this.jong == null) {
      const combined = VOWEL_COMBINE[this.jung + v];
      if (combined) {
        this.jung = combined;
      } else {
        this.commit();
        this.committed += v;
      }
      return;
    }
    const split = CONS_SPLIT[this.jong];
    if (split) {
      const [prevJong, newCho] = split;
      this.committed += assemble(this.cho, this.jung, prevJong);
      this._reset();
      this.cho = newCho;
      this.jung = v;
    } else {
      const newCho = this.jong;
      this.jong = null;
      this.committed += assemble(this.cho, this.jung);
      this._reset();
      if (CHO.includes(newCho)) {
        this.cho = newCho;
        this.jung = v;
      } else {
        this.committed += v;
      }
    }
  }

  backspace() {
    if (this.jong != null) {
      const split = CONS_SPLIT[this.jong];
      this.jong = split ? split[0] : null;
      return;
    }
    if (this.jung != null) {
      const single = VOWEL_SPLIT[this.jung];
      this.jung = single ?? null;
      return;
    }
    if (this.cho != null) {
      this.cho = null;
      return;
    }
    if (this.committed) {
      this.committed = this.committed.slice(0, -1);
    }
  }

  clear() {
    this.committed = '';
    this._reset();
  }

  reset(text = '') {
    this.clear();
    this.committed = text;
  }
}
