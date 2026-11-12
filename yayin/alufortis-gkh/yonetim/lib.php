<?php
/*
 * Alufortis yönetim paneli: ortak işlevler.
 * Sayfalar = şablon (_yonetim-veri/sablon-XX.html) + içerik (icerik.json, yoksa icerik-varsayilan.json).
 * Bu dosya hem panelden hem de yayın akışından (php komut satırı) kullanılır.
 */
declare(strict_types=1);

const DILLER = ['tr' => 'index.html', 'en' => 'en/index.html', 'de' => 'de/index.html'];
const MB_VARSAYILAN = 15;
const MB_EN_FAZLA = 20;
const KATALOG_MB = 40;           // bir katalog dosyası (PDF) en fazla

/** Panelden açılıp kapatılabilen bölümler (anahtar = şablondaki data-bolum / data-b değeri). Açılış filmi ve alt bilgi her zaman açıktır. */
const BOLUMLER = [
    'giris' => 'Giriş mesajları (filmden önceki iki yazı ekranı)',
    'rakamlar' => 'Rakamlar',
    'hakkimizda' => 'Hakkımızda',
    'surec' => 'Fikirden teslimata (süreç)',
    'uretim' => 'Üretim',
    'urunler' => 'Ürün sistemleri',
    'kataloglar' => 'Katalog indirme (ürün sistemlerinde yüklü kataloglar)',
    'sektorler' => 'Sektörler',
    'kalite' => 'Kalite',
    'global' => 'Uluslararası iş ortaklıkları (dünya haritası)',
    'sss' => 'Sıkça sorulan sorular',
    'teklif' => 'Teklif formu ve iletişim',
];

/** Ürün sistemleri: şablondaki kart sırası, dosya adı kökü ve sistem adının içerik alanı. */
const SISTEMLER = [
    1 => ['kok' => 'kapi-pencere-sistemi', 'ad' => 'K188'],
    2 => ['kok' => 'surme-kapi-pencere-sistemi', 'ad' => 'K192'],
    3 => ['kok' => 'cephe-sistemleri', 'ad' => 'K196'],
    4 => ['kok' => 'kupeste-aksesuarlari', 'ad' => 'K200'],
    5 => ['kok' => 'dograma-cam-balkon-aksesuarlari', 'ad' => 'K204'],
    6 => ['kok' => 'epdm-fitil', 'ad' => 'K208'],
];
const KATALOG_INDIR_ALANI = 'K371';

function site_kok(): string { return dirname(__DIR__); }
function veri_dizini(): string { return site_kok() . '/_yonetim-veri'; }
function katalog_dizini(): string { return site_kok() . '/katalog'; }

function json_oku(string $yol, $varsayilan = null)
{
    if (!is_file($yol)) return $varsayilan;
    $v = json_decode((string)file_get_contents($yol), true);
    return is_array($v) ? $v : $varsayilan;
}

function json_yaz(string $yol, array $veri): void
{
    $gecici = $yol . '.tmp' . bin2hex(random_bytes(4));
    if (file_put_contents($gecici, json_encode($veri, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) {
        throw new RuntimeException('Dosya yazılamadı: ' . basename($yol));
    }
    rename($gecici, $yol);
}

/** Varsayılan içerik + sunucudaki düzenlenmiş değerler (yalnızca bilinen alanlar). */
function icerik_yukle(): array
{
    $varsayilan = json_oku(veri_dizini() . '/icerik-varsayilan.json', []);
    $kayitli = json_oku(veri_dizini() . '/icerik.json', []);
    foreach ($varsayilan as $k => &$alan) {
        foreach (array_keys(DILLER) as $dil) {
            if (isset($kayitli[$k][$dil]) && is_string($kayitli[$k][$dil])) $alan[$dil] = $kayitli[$k][$dil];
        }
    }
    return $varsayilan;
}

function site_ayar_yukle(): array
{
    $a = json_oku(veri_dizini() . '/site-ayar.json', []);
    $mb = (int)($a['maks_mb'] ?? MB_VARSAYILAN);
    $a['maks_mb'] = max(1, min(MB_EN_FAZLA, $mb));
    $a['kapali'] = array_values(array_intersect(array_keys(BOLUMLER), is_array($a['kapali'] ?? null) ? $a['kapali'] : []));
    return $a;
}

/** Yüklü kataloglar: [sistem no][dil] => [dosya, ad, boyut, tarih, v]. Dosyası sunucuda olmayan kayıt yok sayılır (yayın akışında dosya kontrolü yapılmaz). */
function katalog_yukle(bool $dosya_denetle = true): array
{
    $k = json_oku(veri_dizini() . '/katalog.json', []);
    $temiz = [];
    foreach (SISTEMLER as $n => $s) {
        foreach (array_keys(DILLER) as $dil) {
            $e = $k[(string)$n][$dil] ?? null;
            if (!is_array($e) || ($e['dosya'] ?? '') !== katalog_dosya_adi($n, $dil)) continue;
            if ($dosya_denetle && !is_file(katalog_dizini() . '/' . $e['dosya'])) continue;
            $temiz[$n][$dil] = $e;
        }
    }
    return $temiz;
}

function katalog_dosya_adi(int $n, string $dil): string { return 'alufortis-' . SISTEMLER[$n]['kok'] . '-' . $dil . '.pdf'; }

/** Panelin yalnızca kilitli alanları: tasarımcı satırı her dilde aynen bulunmalı. */
function kilitli_alanlari_denetle(string $html, string $dil): void
{
    foreach (['https://gkhdigital.ro">gkhdigital.ro</a>', 'https://gkhdigital.com">gkhdigital.com</a>'] as $p) {
        if (!str_contains(str_replace(' target="_blank" rel="noopener"', '', $html), $p)) throw new RuntimeException("Tasarımcı satırı (gkhdigital) sayfada bulunamadı: $dil. Yayın durduruldu.");
    }
}

function js_kacir(string $v): string
{
    return str_replace(['\\', "'", "\r", "\n", '</', "\u{2028}", "\u{2029}"], ['\\\\', "\\'", '', '\\n', '<\\/', '\\u2028', '\\u2029'], $v);
}

function html_kacir(string $v): string
{
    return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML5, 'UTF-8');
}

/** Bir dilin sayfasını üretir. */
function sayfa_uret(string $dil, array $icerik, array $ayar): string
{
    $sablon = file_get_contents(veri_dizini() . "/sablon-$dil.html");
    if ($sablon === false) throw new RuntimeException("Şablon yok: $dil");
    $mb = (string)$ayar['maks_mb'];
    $deger = function (string $k) use ($icerik, $dil, $mb): string {
        if (!isset($icerik[$k])) throw new RuntimeException("Bilinmeyen alan: $k");
        return str_replace('{MB}', $mb, (string)$icerik[$k][$dil]);
    };
    $cikti = preg_replace_callback('/\{\{([TWJ]):(K\d+)\}\}/', function ($m) use ($deger) {
        $v = $deger($m[2]);
        if ($m[1] === 'J') return js_kacir($v);
        if ($m[1] === 'W') {
            $parcalar = preg_split('/\s+/u', trim($v), -1, PREG_SPLIT_NO_EMPTY) ?: [];
            $s = [];
            foreach ($parcalar as $i => $p) $s[] = '<span class="w" style="--i:' . $i . '">' . html_kacir($p) . '</span>';
            return implode(' ', $s);
        }
        return html_kacir($v);
    }, $sablon);
    $cikti = str_replace('{{MAXMB}}', $mb, (string)$cikti);

    // kataloglar: yüklüyse kart PDF'i açar, yoksa (teklif formu açıksa) forma götürüp kataloğu ister
    $kapali = array_flip($ayar['kapali'] ?? []);
    $kataloglar = isset($kapali['kataloglar']) ? [] : ($ayar['katalog'] ?? []);
    $onek = $dil === 'tr' ? '' : '../';
    $cikti = preg_replace_callback('/\{\{KAT:(\d)\}\}/', function ($m) use ($kataloglar, $dil, $onek, $kapali) {
        $e = $kataloglar[(int)$m[1]][$dil] ?? null;
        if ($e) return 'href="' . html_kacir($onek . 'katalog/' . $e['dosya'] . '?v=' . (int)($e['v'] ?? 0)) . '" target="_blank" rel="noopener" type="application/pdf" data-pdf';
        return isset($kapali['teklif']) ? '' : 'href="#teklif"';
    }, $cikti);
    $cikti = preg_replace_callback('/\{\{KATY:(\d):(K\d+)\}\}/', function ($m) use ($kataloglar, $dil, $kapali, $deger) {
        if (!empty($kataloglar[(int)$m[1]][$dil])) return html_kacir($deger(KATALOG_INDIR_ALANI));
        return isset($kapali['teklif']) ? '' : html_kacir($deger($m[2]));
    }, (string)$cikti);

    // kapalı bölümler ve onlara giden menü / kısayol bağlantıları gizlenir
    foreach (array_keys(BOLUMLER) as $b) {
        if (isset($kapali[$b])) {
            $cikti = str_replace(['data-bolum="' . $b . '"', 'data-b="' . $b . '"'], ['data-bolum="' . $b . '" hidden', 'data-b="' . $b . '" hidden'], (string)$cikti);
        }
    }
    $cikti = isset($kapali['giris'])
        ? preg_replace('/<!--B:giris-->.*?<!--\/B:giris-->/s', '', (string)$cikti)
        : str_replace(['<!--B:giris-->', '<!--/B:giris-->'], '', (string)$cikti);

    if (preg_match('/\{\{[A-Z]/', (string)$cikti)) throw new RuntimeException("Doldurulmamış yer tutucu: $dil");
    kilitli_alanlari_denetle((string)$cikti, $dil);
    return (string)$cikti;
}

/** Yayında kullanılan tüm ayarlar: site-ayar.json (ek sınırı, kapalı bölümler) + yüklü kataloglar. */
function yayin_ayari(): array
{
    $a = site_ayar_yukle();
    $a['katalog'] = katalog_yukle(PHP_SAPI !== 'cli');
    return $a;
}

/** Üç dili üretip yerine yazar; önceki sayfaları geçmişe koyar. Dönen: geçmiş klasörünün adı. */
function siteyi_yayinla(array $icerik, array $ayar, bool $gecmise_al = true): string
{
    $kok = site_kok();
    $uretilen = [];
    foreach (DILLER as $dil => $dosya) $uretilen[$dil] = sayfa_uret($dil, $icerik, $ayar);
    $etiket = gmdate('Y-m-d-His');
    if ($gecmise_al) {
        $g = veri_dizini() . "/gecmis/$etiket";
        for ($n = 2; is_dir($g); $n++) { $etiket = gmdate('Y-m-d-His') . "-$n"; $g = veri_dizini() . "/gecmis/$etiket"; }
        if (!is_dir($g) && !mkdir($g, 0750, true)) throw new RuntimeException('Geçmiş klasörü açılamadı');
        foreach (DILLER as $dil => $dosya) if (is_file("$kok/$dosya")) copy("$kok/$dosya", "$g/$dil.html");
        if (is_file(veri_dizini() . '/icerik.json')) copy(veri_dizini() . '/icerik.json', "$g/icerik.json");
        gecmisi_buda(30);
    }
    foreach (DILLER as $dil => $dosya) {
        $hedef = "$kok/$dosya";
        $gecici = $hedef . '.tmp' . bin2hex(random_bytes(4));
        if (file_put_contents($gecici, $uretilen[$dil], LOCK_EX) === false) throw new RuntimeException("Yazılamadı: $dosya");
        rename($gecici, $hedef);
    }
    return $etiket;
}

/** Şablon (yükleme betiğiyle) sayfalardan daha yeni mi? Öyleyse panel “yeniden yayınla” uyarısı gösterir. */
function sablon_yeni_mi(): bool
{
    clearstatcache();
    foreach (DILLER as $dil => $dosya) {
        $s = @filemtime(veri_dizini() . "/sablon-$dil.html");
        $p = @filemtime(site_kok() . "/$dosya");
        if ($s && (!$p || $s > $p + 5)) return true;
    }
    return false;
}

function gecmis_listesi(): array
{
    $l = glob(veri_dizini() . '/gecmis/*', GLOB_ONLYDIR) ?: [];
    rsort($l);
    return array_map('basename', $l);
}

function gecmisi_buda(int $tut): void
{
    foreach (array_slice(gecmis_listesi(), $tut) as $eski) {
        $d = veri_dizini() . "/gecmis/$eski";
        foreach (glob("$d/*") ?: [] as $f) @unlink($f);
        @rmdir($d);
    }
}

/** Form ve sunucu yükleme sınırı: .user.ini (PHP yükleme sınırı) güncellenir. */
function user_ini_yaz(int $mb): void
{
    // sunucu sınırı, panelden yüklenen kataloglar (en fazla KATALOG_MB) için de yeterli olmalı; teklif formu kendi toplam sınırını ayrıca uygular
    $tek = max($mb, KATALOG_MB) + 1;
    $ini = "; Alufortis: teklif formu dosya ekleri (yönetim panelinden: toplam $mb MB) ve katalog yükleme (dosya başına " . KATALOG_MB . " MB)\n"
        . 'upload_max_filesize = ' . $tek . "M\n"
        . 'post_max_size = ' . ($tek + 4) . "M\n"
        . "max_file_uploads = 50\nmax_execution_time = 60\nmemory_limit = 256M\n";
    file_put_contents(site_kok() . '/.user.ini', $ini, LOCK_EX);
}

/** Gizli ayarlar (SMTP): PHP dosyası olarak saklanır, web'den okunamaz. */
function gizli_ayar_yukle(): array
{
    $y = veri_dizini() . '/ayarlar.php';
    $a = is_file($y) ? (include $y) : [];
    return is_array($a) ? $a : [];
}

function gizli_ayar_yaz(array $a): void
{
    $y = veri_dizini() . '/ayarlar.php';
    $icerik = "<?php\n// Alufortis yönetim paneli ayarları. Elle düzenlemeyin.\nreturn " . var_export($a, true) . ";\n";
    $gecici = $y . '.tmp' . bin2hex(random_bytes(4));
    file_put_contents($gecici, $icerik, LOCK_EX);
    @chmod($gecici, 0600);
    rename($gecici, $y);
    if (function_exists('opcache_invalidate')) @opcache_invalidate($y, true);
}

// komut satırı: php yonetim/lib.php uret  -> sayfaları şablon + içerikten üretir (yayın akışı kullanır)
if (PHP_SAPI === 'cli' && isset($argv[1]) && realpath($argv[0]) === __FILE__) {
    if ($argv[1] === 'uret') {
        $etiket = siteyi_yayinla(icerik_yukle(), yayin_ayari(), false);
        echo "Sayfalar üretildi ($etiket), en fazla ek: " . site_ayar_yukle()['maks_mb'] . " MB\n";
    }
    if ($argv[1] === 'ini') { user_ini_yaz(site_ayar_yukle()['maks_mb']); echo ".user.ini yazıldı\n"; }
    if ($argv[1] === 'sifre') {
        $s = (string)getenv('YONETIM_SIFRE');
        if (mb_strlen($s) < 12) { fwrite(STDERR, "YONETIM_SIFRE en az 12 karakter olmalı\n"); exit(1); }
        file_put_contents(veri_dizini() . '/sifre.php', "<?php\nreturn " . var_export(['hash' => password_hash($s, PASSWORD_DEFAULT), 'tarih' => gmdate('c')], true) . ";\n");
        echo "sifre.php hazır\n";
    }
}
