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

function site_kok(): string { return dirname(__DIR__); }
function veri_dizini(): string { return site_kok() . '/_yonetim-veri'; }

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
    return $a;
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
    if (preg_match('/\{\{[A-Z]/', $cikti)) throw new RuntimeException("Doldurulmamış yer tutucu: $dil");
    return $cikti;
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
    $ini = "; Alufortis: teklif formu dosya ekleri (yönetim panelinden: toplam $mb MB)\n"
        . 'upload_max_filesize = ' . ($mb + 1) . "M\n"
        . 'post_max_size = ' . ($mb + 5) . "M\n"
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
        $etiket = siteyi_yayinla(icerik_yukle(), site_ayar_yukle(), false);
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
