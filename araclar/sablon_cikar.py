"""Tek seferlik: yayin/alufortis-gkh/{index,en/index,de/index}.html sayfalarını
şablon (yer tutuculu) + içerik (icerik-varsayilan.json) olarak ayırır."""
import re, json, html, sys, os
ROOT = sys.argv[1]
OUT = os.path.join(ROOT, '_yonetim-veri')
LANGS = [('tr', 'index.html'), ('en', 'en/index.html'), ('de', 'de/index.html')]
SKIP_TAGS = {'script', 'style', 'svg', 'textarea', 'noscript'}
GROUP_NAMES = {'intro': 'Giriş mesajları', 'top': 'Açılış filmi yazıları', 'nav': 'Üst menü', 'stats': 'Rakamlar', 'hakkimizda': 'Hakkımızda', 'surec': 'Fikirden teslimata (süreç)', 'uretim': 'Üretim', 'urunler': 'Ürün sistemleri', 'sektorler': 'Sektörler', 'kalite': 'Kalite', 'glob': 'Uluslararası iş ortaklıkları', 'sss': 'Sıkça sorulan sorular', 'teklif': 'Teklif formu ve iletişim', 'footer': 'Alt bilgi'}

def js_lits(sc):
    skip = [(m.start(), m.end()) for m in re.finditer(r'^const fmt = .*$', sc, re.M)]
    return [m for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'", sc) if not any(a <= m.start() < b for a, b in skip)]

def extract(s, lang):
    """returns (template, entries) entries: list of (kind, group, value)"""
    entries = []
    def add(kind, group, val, ctx):
        entries.append({'kind': kind, 'group': group, 'v': val, 'ctx': ctx})
        return len(entries) - 1
    # ---- HERO_I18N: values for this language (en/de), then neutralise the statement
    m = re.search(r"const HERO_I18N = (\{.*?\n\})\[\(document\.documentElement\.lang \|\| 'tr'\)\.slice\(0, 2\)\];", s, re.S)
    assert m
    hero = None
    if lang != 'tr':
        js = m.group(1)
        block = re.search(lang + r": (\[\[.*?\]\])(,\n|\n)", js, re.S).group(1)
        hero = json.loads(block.replace("'", '"')) if '"' not in block else None
        if hero is None:
            hero = [[x.group(1).replace("\\'", "'") for x in re.finditer(r"'((?:[^'\\]|\\.)*)'", row)] for row in re.findall(r"\[([^\[\]]*)\]", block)]
    s = s[:m.start()] + 'const HERO_I18N = null;' + s[m.end():]
    head_end = s.index('</head>')
    # ---- head: title, meta description, og
    def head_sub(mm):
        k = add('t', 'Sayfa başlığı ve arama motoru', html.unescape(mm.group(2)), mm.group(1))
        return mm.group(1).replace(mm.group(2), '{{T%d}}' % k) if False else '%s{{T%d}}%s' % (mm.group(1), k, mm.group(3))
    head = s[:head_end]
    head = re.sub(r'(<title>)(.*?)(</title>)', head_sub, head, count=1)
    head = re.sub(r'(<meta (?:name="description"|property="og:title"|property="og:description") content=")([^"]*)(")', head_sub, head)
    body = s[head_end:]
    # ---- body tokens
    out = []; divs = 0; band_depth = None; group = 'Genel'; band_i = -1; band_slot = 0; soft = None
    toks = re.split(r'(<!--.*?-->|<[^>]+>)', body, flags=re.S)
    i = 0
    while i < len(toks):
        t = toks[i]
        if t.startswith('<!--'): out.append(t); i += 1; continue
        if t.startswith('<'):
            tm = re.match(r'<\s*(/?)\s*([a-zA-Z0-9]+)', t)
            if tm:
                closing, tag = tm.group(1) == '/', tm.group(2).lower()
                if tag in SKIP_TAGS:
                    if not closing and not t.endswith('/>'):
                        # copy raw until matching close tag
                        j = i + 1; depth = 1; raw = [t]
                        while j < len(toks):
                            raw.append(toks[j])
                            mm2 = re.match(r'<\s*(/?)\s*' + tag + r'\b', toks[j]) if toks[j].startswith('<') else None
                            if mm2: depth += -1 if mm2.group(1) else 1
                            if depth == 0: break
                            j += 1
                        chunk = ''.join(raw)
                        if tag == 'script': chunk = SCRIPT_HOOK(chunk, add, lang)
                        out.append(chunk); i = j + 1; continue
                if closing and tag == 'div':
                    if band_depth is not None and divs == band_depth: band_depth = None
                    divs -= 1
                if not closing:
                    idm = re.search(r'\bid="([^"]+)"', t)
                    if tag in ('section', 'header', 'footer', 'nav') or (idm and idm.group(1) == 'intro'):
                        clm = re.search(r'\bclass="([^" ]+)', t)
                        gid = idm.group(1) if idm else (clm.group(1) if tag == 'section' and clm else tag)
                        group = GROUP_NAMES.get(gid, {'footer': 'Alt bilgi', 'nav': 'Üst menü'}.get(tag, gid))
                    if tag == 'div' and not t.endswith('/>'):
                        divs += 1
                        if 'class="band ' in t: band_i += 1; band_slot = 0; band_depth = divs
                    # intro main sentence: whole <p class="i-main"> as one field
                    if tag == 'p' and 'class="i-main"' in t:
                        j = i; inner = []
                        while not toks[j].startswith('</p'): j += 1
                        full = html.unescape(re.search(r'aria-label="([^"]*)"', t).group(1))
                        k = add('w', group, full, 'Ana mesaj (kelime kelime belirir)')
                        out.append(re.sub(r'aria-label="[^"]*"', 'aria-label="{{T%d}}"' % k, t) + '{{W%d}}' % k + '</p>')
                        i = j + 1; continue
                    # attributes
                    def attr_sub(am):
                        val = html.unescape(am.group(2))
                        if not val.strip() or am.group(1) == 'placeholder' and re.fullmatch(r'[+\d\s]*', val): pass
                        if not val.strip(): return am.group(0)
                        k = add('a', group, val, am.group(1) + ' (' + tag + ')')
                        return '%s="{{T%d}}"' % (am.group(1), k)
                    t = re.sub(r'\b(alt|placeholder|data-catalog)="([^"]*)"', attr_sub, t)
                    # stats numbers
                    def num_sub(am):
                        k = add('n', group, am.group(2), 'sayı: ' + am.group(1))
                        return '%s="{{T%d}}"' % (am.group(1), k)
                    if 'class="n"' in t: t = re.sub(r'\b(data-to|data-suffix)="([^"]*)"', num_sub, t)
                    if 'class="soft"' in t:
                        soft = 'pending'
            out.append(t); i += 1; continue
        # text node
        if t.strip() and t.strip() not in ('0', 'TR', 'EN', 'DE'):
            lead = t[:len(t) - len(t.lstrip())]; trail = t[len(t.rstrip()):]
            val = html.unescape(t.strip())
            ctx = re.match(r'<\s*([a-zA-Z0-9]+)', next((x for x in reversed(out) if x.startswith('<') and not x.startswith('</')), '<x'))
            ctx = ctx.group(1) if ctx else ''
            in_band = band_depth is not None
            if isinstance(soft, tuple):
                k = soft[1]; soft = None; band_slot = 1
            else:
                if in_band and hero is not None:
                    row = hero[band_i]
                    if band_slot < len(row): val = row[band_slot]
                k = add('t', group, val, ('Film yazısı %d' % (band_i + 1) if in_band else ctx))
                if soft == 'pending': soft = ('used', k)
                elif in_band: band_slot += 1
            out.append(lead + '{{T%d}}' % k + trail)
        else:
            out.append(t)
        i += 1
    return head + ''.join(out), entries

def SCRIPT_HOOK(chunk, add, lang):
    # localised string literals in the main script: those that differ between languages (decided later)
    return chunk

res = {}
for lang, f in LANGS:
    s = open(os.path.join(ROOT, f)).read()
    res[lang] = extract(s, lang)
# --- js literals in the main page script (the long one): localized = differ across languages
def main_script_span(tpl):
    best = None
    for m in re.finditer(r'<script>(.*?)</script>', tpl, re.S):
        if best is None or len(m.group(1)) > len(best.group(1)): best = m
    return best
spans = {l: main_script_span(res[l][0]) for l in res}
lits = {l: js_lits(spans[l].group(1)) for l in res}
n = len(lits['tr']); assert all(len(lits[l]) == n for l in lits), {l: len(lits[l]) for l in lits}
jsidx = []
for i in range(n):
    vals = [lits[l][i].group(1) for l in ('tr', 'en', 'de')]
    if len(set(vals)) > 1 and len(vals[0]) > 1 and not re.search(r'\.(php|json|mp4|jpg|png|webp|svg)$', vals[0]):
        jsidx.append(i)
for l in res:
    tpl, ent = res[l]
    sc = spans[l].group(1); pieces = []; last = 0
    for i in jsidx:
        m = lits[l][i]
        k = len(ent); ent.append({'kind': 'j', 'group': 'Sayfa içi kısa metinler (3D, harita, form)', 'v': m.group(1).replace("\\'", "'"), 'ctx': 'kod metni'})
        pieces.append(sc[last:m.start(1)] + '{{J%d}}' % k); last = m.end(1)
    pieces.append(sc[last:])
    sc2 = ''.join(pieces)
    tpl = tpl[:spans[l].start(1)] + sc2 + tpl[spans[l].end(1):]
    res[l] = (tpl, ent)
# --- alignment check
L = {l: len(res[l][1]) for l in res}
assert len(set(L.values())) == 1, L
N = L['tr']
for i in range(N):
    kinds = {res[l][1][i]['kind'] for l in res}
    assert len(kinds) == 1, (i, kinds)
# --- max MB tokens
def mb(v): return re.sub(r'\b15 MB', '{MB} MB', v)
os.makedirs(OUT, exist_ok=True)
icerik = {}
for i in range(N):
    e = res['tr'][1][i]
    icerik['K%d' % i] = {'grup': e['group'], 'tur': e['kind'], 'not': e['ctx'], 'tr': mb(e['v']), 'en': mb(res['en'][1][i]['v']), 'de': mb(res['de'][1][i]['v'])}
for l in res:
    tpl = res[l][0]
    tpl = re.sub(r'\{\{([TWJ])(\d+)\}\}', lambda m: '{{%s:K%s}}' % (m.group(1), m.group(2)), tpl)
    tpl = tpl.replace('const MAX = 15 * 1024 * 1024', 'const MAX = {{MAXMB}} * 1024 * 1024').replace("' / 15 MB'", "' / {{MAXMB}} MB'")
    assert '15 MB' not in tpl.replace('{{', ''), [x for x in re.findall(r'.{40}15 MB.{20}', tpl)]
    open(os.path.join(OUT, 'sablon-%s.html' % l), 'w').write(tpl)
json.dump(icerik, open(os.path.join(OUT, 'icerik-varsayilan.json'), 'w'), ensure_ascii=False, indent=1)
print('alan sayısı', N, 'js', len(jsidx))
from collections import Counter
print(Counter(v['grup'] for v in icerik.values()))
