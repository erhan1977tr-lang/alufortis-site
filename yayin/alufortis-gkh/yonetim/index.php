<?php
/*
 * Alufortis yönetim paneli: sayfa yazıları (TR/EN/DE), e-posta (SMTP) ayarları, ek dosya sınırı, şifre.
 * Güvenlik: yalnızca HTTPS, şifre (password_hash), hatalı girişte kilit, oturum çerezi Secure/HttpOnly/SameSite=Strict, CSRF belirteci.
 */
declare(strict_types=1);
require_once __DIR__ . '/lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Cache-Control: no-store');
header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; form-action 'self'");

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
if (!$https) {
    header('Location: https://' . ($_SERVER['HTTP_HOST'] ?? 'alufortis.gkh.ro') . ($_SERVER['REQUEST_URI'] ?? '/yonetim/'), true, 301);
    exit;
}

session_name('ALUYON');
session_set_cookie_params(['lifetime' => 0, 'path' => '/yonetim/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

const OTURUM_SURESI = 7200;      // 2 saat hareketsizlikte çıkış
const KILIT_DENEME = 5;          // IP başına 5 hatalı giriş
const KILIT_SURE = 900;          // 15 dakika kilit
const GENEL_SINIR = 30;          // saatte toplam 30 hatalı giriş: herkes için 15 dakika kilit

function h(string $v): string { return htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function sifre_dosyasi(): string { return veri_dizini() . '/sifre.php'; }
function sifre_hash(): string { $a = is_file(sifre_dosyasi()) ? (include sifre_dosyasi()) : []; return is_array($a) ? (string)($a['hash'] ?? '') : ''; }
function sifre_kaydet(string $sifre): void
{
    $hash = password_hash($sifre, PASSWORD_DEFAULT);
    file_put_contents(sifre_dosyasi(), "<?php\nreturn " . var_export(['hash' => $hash, 'tarih' => gmdate('c')], true) . ";\n", LOCK_EX);
    if (function_exists('opcache_invalidate')) @opcache_invalidate(sifre_dosyasi(), true);
}

function kilit_dizini(): string { $d = veri_dizini() . '/giris'; if (!is_dir($d)) @mkdir($d, 0750, true); return $d; }
function kilit_oku(string $ad): array { $f = kilit_dizini() . "/$ad.json"; $v = is_file($f) ? json_decode((string)file_get_contents($f), true) : null; return is_array($v) ? $v : []; }
function kilit_yaz(string $ad, array $v): void { file_put_contents(kilit_dizini() . "/$ad.json", json_encode($v), LOCK_EX); }
function ip_anahtar(): string { return 'ip-' . substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '0') . '|alufortis-yonetim'), 0, 24); }
function kilitli_mi(): int
{
    $simdi = time();
    $ip = kilit_oku(ip_anahtar());
    $genel = kilit_oku('genel');
    $ipler = array_filter($ip['h'] ?? [], fn($t) => $t > $simdi - KILIT_SURE);
    $geneller = array_filter($genel['h'] ?? [], fn($t) => $t > $simdi - 3600);
    if (count($ipler) >= KILIT_DENEME) return max($ipler) + KILIT_SURE - $simdi;
    if (count($geneller) >= GENEL_SINIR) return max($geneller) + KILIT_SURE - $simdi;
    return 0;
}
function hatali_giris(): void
{
    $simdi = time();
    foreach ([ip_anahtar() => KILIT_SURE, 'genel' => 3600] as $ad => $sure) {
        $v = kilit_oku($ad);
        $v['h'] = array_values(array_filter($v['h'] ?? [], fn($t) => $t > $simdi - $sure));
        $v['h'][] = $simdi;
        kilit_yaz($ad, $v);
    }
}

function csrf(): string { if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32)); return $_SESSION['csrf']; }
function csrf_dogrula(): void
{
    if (!hash_equals((string)($_SESSION['csrf'] ?? ''), (string)($_POST['csrf'] ?? ''))) { http_response_code(400); exit('Oturum doğrulanamadı. Sayfayı yenileyip tekrar deneyin.'); }
}
function bildir(string $tur, string $mesaj): void { $_SESSION['bildirim'] = [$tur, $mesaj]; }
function yonlendir(string $s, string $ek = ''): void { header('Location: ./?s=' . rawurlencode($s) . $ek, true, 303); exit; }

// oturum süresi
if (!empty($_SESSION['giris']) && (time() - (int)($_SESSION['son'] ?? 0)) > OTURUM_SURESI) { $_SESSION = []; session_regenerate_id(true); }
if (!empty($_SESSION['giris'])) $_SESSION['son'] = time();
$girisli = !empty($_SESSION['giris']);
$s = (string)($_GET['s'] ?? 'yazilar');

// ---------- ilk kurulum: şifre yoksa, elle yüklemede verilen tek kullanımlık kodla şifre belirlenir ----------
function kurulum_dosyasi(): string { return veri_dizini() . '/kurulum.php'; }
function kurulum_bilgi(): array
{
    if (sifre_hash() !== '' || !is_file(kurulum_dosyasi())) return [];
    $a = include kurulum_dosyasi();
    if (!is_array($a) || empty($a['kod_hash'])) return [];
    if (time() - (int)strtotime((string)($a['tarih'] ?? '')) > 7 * 86400) return [];
    return $a;
}
if (!$girisli && $_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['islem'] ?? '') === 'kurulum') {
    csrf_dogrula();
    $kalan = kilitli_mi();
    if ($kalan > 0) { bildir('hata', 'Çok fazla hatalı deneme. Lütfen ' . ceil($kalan / 60) . ' dakika sonra tekrar deneyin.'); yonlendir('giris'); }
    $k = kurulum_bilgi();
    $kod = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', (string)($_POST['kod'] ?? '')) ?? '');
    if (!$k || !hash_equals((string)$k['kod_hash'], hash('sha256', $kod))) { hatali_giris(); usleep(random_int(300000, 700000)); bildir('hata', 'Kurulum kodu hatalı.'); yonlendir('giris'); }
    $yeni = (string)($_POST['yeni'] ?? '');
    if (mb_strlen($yeni) < 12) { bildir('hata', 'Şifre en az 12 karakter olmalı.'); yonlendir('giris'); }
    if ($yeni !== (string)($_POST['yeni2'] ?? '')) { bildir('hata', 'Şifreler aynı değil.'); yonlendir('giris'); }
    sifre_kaydet($yeni);
    @unlink(kurulum_dosyasi());
    session_regenerate_id(true);
    $_SESSION = ['giris' => true, 'son' => time(), 'csrf' => bin2hex(random_bytes(32)), 'bildirim' => ['tamam', 'Şifreniz belirlendi. Panele hoş geldiniz.']];
    yonlendir('yazilar');
}

// ---------- giriş / çıkış ----------
if (!$girisli && $_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['islem'] ?? '') === 'giris') {
    csrf_dogrula();
    $kalan = kilitli_mi();
    if ($kalan > 0) { bildir('hata', 'Çok fazla hatalı deneme. Lütfen ' . ceil($kalan / 60) . ' dakika sonra tekrar deneyin.'); yonlendir('giris'); }
    $hash = sifre_hash();
    if ($hash !== '' && password_verify((string)($_POST['sifre'] ?? ''), $hash)) {
        session_regenerate_id(true);
        $_SESSION = ['giris' => true, 'son' => time(), 'csrf' => bin2hex(random_bytes(32))];
        if (password_needs_rehash($hash, PASSWORD_DEFAULT)) sifre_kaydet((string)$_POST['sifre']);
        yonlendir('yazilar');
    }
    hatali_giris();
    usleep(random_int(300000, 700000));
    bildir('hata', 'Şifre hatalı.');
    yonlendir('giris');
}
if ($girisli && $s === 'cikis' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_dogrula();
    $_SESSION = []; session_regenerate_id(true);
    bildir('tamam', 'Çıkış yapıldı.');
    yonlendir('giris');
}

// ---------- işlemler (girişli) ----------
if ($girisli && $_SERVER['REQUEST_METHOD'] === 'POST') {
    csrf_dogrula();
    $islem = (string)($_POST['islem'] ?? '');
    try {
        if ($islem === 'yazilar') {
            $icerik = icerik_yukle();
            $kayitli = json_oku(veri_dizini() . '/icerik.json', []);
            $gelen = is_array($_POST['a'] ?? null) ? $_POST['a'] : [];
            $degisen = 0;
            foreach ($gelen as $k => $diller) {
                if (!isset($icerik[$k]) || !is_array($diller)) continue;
                foreach (array_keys(DILLER) as $dil) {
                    if (!isset($diller[$dil]) || !is_string($diller[$dil])) continue;
                    $yeni = str_replace("\r\n", "\n", $diller[$dil]);
                    $yeni = $icerik[$k]['tur'] === 'n' ? trim($yeni) : trim(preg_replace('/[ \t]+/', ' ', $yeni) ?? '');
                    if ($icerik[$k]['tur'] === 'n' && str_starts_with((string)$icerik[$k]['not'], 'sayı: data-to') && !preg_match('/^\d+(\.\d+)?$/', $yeni)) {
                        throw new RuntimeException('Sayı alanına yalnızca rakam girilebilir (ondalık için nokta): ' . $yeni);
                    }
                    if (mb_strlen($yeni) > 4000) throw new RuntimeException('Bir alan en fazla 4000 karakter olabilir.');
                    if ($yeni !== $icerik[$k][$dil]) { $kayitli[$k][$dil] = $yeni; $icerik[$k][$dil] = $yeni; $degisen++; }
                }
            }
            if ($degisen === 0) { bildir('bilgi', 'Değişiklik yok.'); yonlendir('yazilar', '&g=' . rawurlencode((string)($_POST['g'] ?? ''))); }
            $etiket = siteyi_yayinla($icerik, site_ayar_yukle());
            json_yaz(veri_dizini() . '/icerik.json', $kayitli);
            bildir('tamam', "$degisen alan güncellendi ve sitede yayınlandı.");
            yonlendir('yazilar', '&g=' . rawurlencode((string)($_POST['g'] ?? '')));
        }
        if ($islem === 'eposta') {
            $a = gizli_ayar_yukle();
            $alici = trim((string)($_POST['alici'] ?? ''));
            foreach (preg_split('/[\s,;]+/', $alici, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $x) if (!filter_var($x, FILTER_VALIDATE_EMAIL)) throw new RuntimeException("Geçersiz alıcı adresi: $x");
            $gon = trim((string)($_POST['gonderen_eposta'] ?? ''));
            if ($gon !== '' && !filter_var($gon, FILTER_VALIDATE_EMAIL)) throw new RuntimeException('Gönderen e-posta adresi geçersiz.');
            $port = (int)($_POST['smtp_port'] ?? 587);
            if ($port < 1 || $port > 65535) throw new RuntimeException('Port 1 ile 65535 arasında olmalı.');
            $guv = in_array($_POST['smtp_guvenlik'] ?? '', ['tls', 'ssl', 'yok'], true) ? $_POST['smtp_guvenlik'] : 'tls';
            $a = array_merge($a, [
                'alici' => $alici,
                'gonderen_adi' => trim((string)($_POST['gonderen_adi'] ?? '')),
                'gonderen_eposta' => $gon,
                'smtp_sunucu' => trim((string)($_POST['smtp_sunucu'] ?? '')),
                'smtp_port' => $port,
                'smtp_guvenlik' => $guv,
                'smtp_kullanici' => trim((string)($_POST['smtp_kullanici'] ?? '')),
            ]);
            if (($_POST['smtp_sifre'] ?? '') !== '') $a['smtp_sifre'] = (string)$_POST['smtp_sifre'];
            if (!empty($_POST['smtp_sifre_sil'])) $a['smtp_sifre'] = '';
            gizli_ayar_yaz($a);
            bildir('tamam', 'E-posta ayarları kaydedildi.');
            yonlendir('ayarlar');
        }
        if ($islem === 'deneme') {
            require_once __DIR__ . '/posta.php';
            $gecici = tempnam(sys_get_temp_dir(), 'alf');
            file_put_contents($gecici, "Alufortis teklif formu - deneme eki\n");
            $r = teklif_epostasi_gonder(['ad' => 'Test Kullanıcısı', 'firma' => 'Alufortis Yönetim Paneli Denemesi', 'eposta' => 'noreply@alufortis.gkh.ro', 'tel' => '', 'mesaj' => "Bu bir deneme mesajıdır. Yönetim panelindeki e-posta ayarları kontrol ediliyor.", 'dil' => 'tr'], [['isim' => 'deneme-eki.txt', 'yol' => $gecici, 'boyut' => (int)filesize($gecici)]]);
            @unlink($gecici);
            $r['ok'] ? bildir('tamam', 'Deneme e-postası gönderildi. Alıcı kutusunu (ve spam klasörünü) kontrol edin.') : bildir('hata', 'Deneme e-postası gönderilemedi: ' . $r['hata']);
            yonlendir('ayarlar');
        }
        if ($islem === 'sinir') {
            $mb = (int)($_POST['maks_mb'] ?? MB_VARSAYILAN);
            if ($mb < 1 || $mb > MB_EN_FAZLA) throw new RuntimeException('Sınır 1 ile ' . MB_EN_FAZLA . ' MB arasında olmalı.');
            $ayar = site_ayar_yukle(); $ayar['maks_mb'] = $mb;
            json_yaz(veri_dizini() . '/site-ayar.json', $ayar);
            user_ini_yaz($mb);
            siteyi_yayinla(icerik_yukle(), $ayar);
            bildir('tamam', "Ek dosya sınırı toplam $mb MB olarak ayarlandı ve sitede yayınlandı.");
            yonlendir('ayarlar');
        }
        if ($islem === 'sifre') {
            if (!password_verify((string)($_POST['eski'] ?? ''), sifre_hash())) throw new RuntimeException('Mevcut şifre hatalı.');
            $yeni = (string)($_POST['yeni'] ?? '');
            if (mb_strlen($yeni) < 12) throw new RuntimeException('Yeni şifre en az 12 karakter olmalı.');
            if ($yeni !== (string)($_POST['yeni2'] ?? '')) throw new RuntimeException('Yeni şifreler aynı değil.');
            sifre_kaydet($yeni);
            session_regenerate_id(true);
            bildir('tamam', 'Şifre değiştirildi.');
            yonlendir('ayarlar');
        }
        if ($islem === 'geri') {
            $etiket = (string)($_POST['etiket'] ?? '');
            if (!in_array($etiket, gecmis_listesi(), true)) throw new RuntimeException('Kayıt bulunamadı.');
            $kayit = veri_dizini() . "/gecmis/$etiket/icerik.json";
            $eski = json_oku($kayit, []);
            $simdiki = icerik_yukle();
            $varsayilan = json_oku(veri_dizini() . '/icerik-varsayilan.json', []);
            foreach ($simdiki as $k => &$alan) foreach (array_keys(DILLER) as $dil) $alan[$dil] = $eski[$k][$dil] ?? $varsayilan[$k][$dil];
            unset($alan);
            siteyi_yayinla($simdiki, site_ayar_yukle());
            json_yaz(veri_dizini() . '/icerik.json', $eski);
            bildir('tamam', 'Yazılar ' . $etiket . ' kaydından önceki hâline döndürüldü ve yayınlandı.');
            yonlendir('gecmis');
        }
    } catch (\Throwable $e) {
        bildir('hata', $e->getMessage());
        yonlendir($s === 'giris' ? 'yazilar' : $s, isset($_POST['g']) ? '&g=' . rawurlencode((string)$_POST['g']) : '');
    }
}

$bildirim = $_SESSION['bildirim'] ?? null; unset($_SESSION['bildirim']);
if (!$girisli) $s = 'giris';

// ---------- görünüm ----------
$TUR_AD = ['h1' => 'Ana başlık', 'h2' => 'Başlık', 'h3' => 'Alt başlık', 'h4' => 'Alt başlık', 'p' => 'Paragraf', 'a' => 'Bağlantı / düğme', 'button' => 'Düğme', 'li' => 'Liste maddesi', 'span' => 'Kısa metin', 'b' => 'Kısa metin', 'strong' => 'Vurgulu metin', 'em' => 'Vurgulu metin', 'i' => 'Kısa metin', 'dt' => 'Etiket', 'dd' => 'Bilgi', 'label' => 'Form etiketi', 'summary' => 'Soru', 'small' => 'Küçük not', 'div' => 'Metin', 'figcaption' => 'Görsel yazısı', 'th' => 'Tablo başlığı', 'td' => 'Tablo hücresi', 'title' => 'Sekme başlığı', 'svg' => 'Kısa metin', 'cite' => 'Kaynak', 'kod metni' => 'Hareketli bölümdeki metin'];
function alan_adi(array $a, array $TUR_AD): string
{
    $n = (string)$a['not'];
    if (str_starts_with($n, 'Film yazısı')) return $n;
    if (str_starts_with($n, 'sayı: data-to')) return 'Sayaç değeri (sayı)';
    if (str_starts_with($n, 'sayı: data-suffix')) return 'Sayaç eki (ör. +, m)';
    if (str_starts_with($n, 'alt')) return 'Görsel açıklaması (erişilebilirlik)';
    if (str_starts_with($n, 'placeholder')) return 'Form kutusu içindeki ipucu';
    if (str_starts_with($n, 'data-catalog')) return 'Katalog adı (forma yazılır)';
    if (str_contains($n, 'description')) return 'Arama motoru açıklaması';
    if (str_contains($n, 'og:title')) return 'Paylaşım başlığı';
    if (str_contains($n, 'og:description')) return 'Paylaşım açıklaması';
    if (str_starts_with($n, '<title')) return 'Sekme başlığı';
    return $TUR_AD[$n] ?? ($n !== '' ? $n : 'Metin');
}
?><!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Alufortis Yönetim Paneli</title>
<link rel="icon" href="../assets/favicon.svg" type="image/svg+xml">
<style>
:root{--bg:#EEF1F5;--panel:#fff;--ink:#141B24;--mut:#6B7785;--line:#E1E6EC;--dark:#0F141B;--acc:#1F7FC4;--acc2:#4CB7FF;--org:#F26B1D;--ok:#1E8E5A;--err:#C0392B}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
a{color:var(--acc)}
.top{background:var(--dark);color:#fff;display:flex;align-items:center;gap:20px;padding:12px 24px;border-bottom:3px solid var(--org);position:sticky;top:0;z-index:5}
.top img{height:66px;display:block}
.top nav{display:flex;gap:4px;flex:1}
.top nav a{color:#C9D1DB;text-decoration:none;padding:8px 14px;border-radius:6px;font-weight:600}
.top nav a.on,.top nav a:hover{background:rgba(255,255,255,.08);color:#fff}
.top form button{background:transparent;border:1px solid rgba(255,255,255,.25);color:#C9D1DB;padding:7px 14px;border-radius:6px;cursor:pointer;font:inherit}
.top .site{color:#C9D1DB;font-size:13px;text-decoration:none}
.wrap{max-width:1360px;margin:0 auto;padding:24px}
.msg{padding:12px 16px;border-radius:8px;margin:0 0 18px;font-weight:600}
.msg.tamam{background:#E3F4EA;color:var(--ok)}.msg.hata{background:#FBE7E5;color:var(--err)}.msg.bilgi{background:#E6F1FA;color:var(--acc)}
.card{background:var(--panel);border-radius:10px;box-shadow:0 1px 2px rgba(15,20,27,.06);padding:22px 24px;margin:0 0 20px}
h1{font-size:22px;margin:0 0 6px}h2{font-size:17px;margin:0 0 14px}
.mut{color:var(--mut);font-size:13px}
.lay{display:grid;grid-template-columns:250px 1fr;gap:20px;align-items:start}
.groups{position:sticky;top:90px;background:var(--panel);border-radius:10px;padding:10px;max-height:calc(100vh - 110px);overflow:auto}
.groups a{display:flex;justify-content:space-between;padding:8px 10px;border-radius:6px;text-decoration:none;color:var(--ink);font-weight:500}
.groups a span{color:var(--mut);font-size:12px}
.groups a.on{background:var(--dark);color:#fff}.groups a.on span{color:#9AA7B6}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:14px 0;border-top:1px solid var(--line)}
.row:first-of-type{border-top:0}
.row .lbl{grid-column:1/-1;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--mut)}
.row .lbl b{color:var(--ink);text-transform:none;letter-spacing:0;font-weight:600}
.fld label{display:block;font-size:11px;font-weight:700;color:var(--acc);margin:0 0 3px;letter-spacing:.08em}
textarea,input[type=text],input[type=email],input[type=password],input[type=number],select{width:100%;font:inherit;padding:8px 10px;border:1px solid #CBD3DC;border-radius:6px;background:#fff;color:var(--ink)}
textarea{resize:vertical;min-height:40px}
textarea:focus,input:focus,select:focus{outline:2px solid var(--acc2);border-color:var(--acc2)}
textarea.chg{border-color:var(--org);background:#FFF8F2}
.bar{position:sticky;bottom:0;background:rgba(238,241,245,.95);padding:14px 0;display:flex;gap:12px;align-items:center;backdrop-filter:blur(6px)}
.btn{background:var(--dark);color:#fff;border:0;border-radius:7px;padding:11px 20px;font:600 15px/1 inherit;cursor:pointer}
.btn.sec{background:#fff;color:var(--ink);border:1px solid #CBD3DC}
.btn:disabled{opacity:.5;cursor:default}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px 20px}
.grid2 .full{grid-column:1/-1}
.f label{display:block;font-size:13px;font-weight:600;margin:0 0 4px}
.search{margin:0 0 12px}
.login{max-width:380px;margin:12vh auto;background:var(--panel);border-radius:12px;overflow:hidden;box-shadow:0 10px 40px rgba(15,20,27,.12)}
.login .hd{background:var(--dark);padding:26px;text-align:center;border-bottom:3px solid var(--org)}
.login .hd img{height:105px}
.login form{padding:26px}
table.l{width:100%;border-collapse:collapse}table.l td{padding:10px 8px;border-top:1px solid var(--line)}
@media (max-width:900px){.lay{grid-template-columns:1fr}.groups{position:static;max-height:none}.row{grid-template-columns:1fr}.grid2{grid-template-columns:1fr}.top{flex-wrap:wrap}}
</style>
</head>
<body>
<?php if ($s === 'giris'): ?>
<div class="login">
  <div class="hd"><img src="../assets/logo-dark.svg" alt="Alufortis"></div>
  <form method="post" action="./?s=giris" autocomplete="off">
    <h1>Yönetim paneli</h1>
    <p class="mut">alufortis.gkh.ro</p>
    <?php if ($bildirim): ?><div class="msg <?= h($bildirim[0]) ?>"><?= h($bildirim[1]) ?></div><?php endif; ?>
    <?php if (sifre_hash() === '' && kurulum_bilgi()): ?>
      <p>İlk kurulum: yükleme betiğinin gösterdiği kurulum kodunu girin ve panel şifrenizi belirleyin.</p>
      <input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><input type="hidden" name="islem" value="kurulum">
      <div class="f"><label for="kod">Kurulum kodu</label><input id="kod" type="text" name="kod" autocomplete="off" required autofocus></div>
      <div class="f" style="margin-top:10px"><label for="yeni">Yeni şifre (en az 12 karakter)</label><input id="yeni" type="password" name="yeni" autocomplete="new-password" minlength="12" required></div>
      <div class="f" style="margin-top:10px"><label for="yeni2">Yeni şifre (tekrar)</label><input id="yeni2" type="password" name="yeni2" autocomplete="new-password" minlength="12" required></div>
      <p><button class="btn" type="submit" style="width:100%">Şifreyi belirle</button></p>
    <?php elseif (sifre_hash() === ''): ?>
      <div class="msg hata">Panel şifresi henüz tanımlanmamış.</div>
    <?php else: ?>
      <input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><input type="hidden" name="islem" value="giris">
      <div class="f"><label for="sifre">Şifre</label><input id="sifre" type="password" name="sifre" autocomplete="current-password" required autofocus></div>
      <p><button class="btn" type="submit" style="width:100%">Giriş</button></p>
    <?php endif; ?>
  </form>
</div>
<?php else: ?>
<div class="top">
  <img src="../assets/logo-dark.svg" alt="Alufortis">
  <nav>
    <a href="./?s=yazilar" class="<?= $s === 'yazilar' ? 'on' : '' ?>">Yazılar</a>
    <a href="./?s=ayarlar" class="<?= $s === 'ayarlar' ? 'on' : '' ?>">E-posta ve ayarlar</a>
    <a href="./?s=gecmis" class="<?= $s === 'gecmis' ? 'on' : '' ?>">Geçmiş</a>
  </nav>
  <a class="site" href="../" target="_blank" rel="noopener">Siteyi aç ↗</a>
  <form method="post" action="./?s=cikis"><input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><button type="submit">Çıkış</button></form>
</div>
<div class="wrap">
<?php if ($bildirim): ?><div class="msg <?= h($bildirim[0]) ?>"><?= h($bildirim[1]) ?></div><?php endif; ?>

<?php if ($s === 'yazilar'):
    $icerik = icerik_yukle();
    $gruplar = [];
    foreach ($icerik as $k => $a) $gruplar[$a['grup']][$k] = $a;
    $g = (string)($_GET['g'] ?? '');
    if (!isset($gruplar[$g])) $g = (string)array_key_first($gruplar);
?>
  <div class="lay">
    <div class="groups">
      <?php foreach ($gruplar as $ad => $alanlar): ?>
        <a href="./?s=yazilar&amp;g=<?= h(rawurlencode($ad)) ?>" class="<?= $ad === $g ? 'on' : '' ?>"><?= h($ad) ?> <span><?= count($alanlar) ?></span></a>
      <?php endforeach; ?>
    </div>
    <div>
      <form method="post" action="./?s=yazilar" id="yform">
        <div class="card">
          <h1><?= h($g) ?></h1>
          <p class="mut">Üç dilin yazılarını yan yana düzenleyin. “Kaydet ve yayınla” ile değişiklikler hemen sitede görünür; önceki hâli “Geçmiş” bölümünde saklanır. <code>{MB}</code> ifadesi ek dosya sınırıyla otomatik değiştirilir.</p>
          <input class="search" type="text" id="ara" placeholder="Bu bölümde ara…">
          <input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><input type="hidden" name="islem" value="yazilar"><input type="hidden" name="g" value="<?= h($g) ?>">
          <?php $film = []; foreach ($gruplar[$g] as $k => $a): $uzun = max(mb_strlen($a['tr']), mb_strlen($a['en']), mb_strlen($a['de']));
              $etiket = alan_adi($a, $TUR_AD);
              if (str_starts_with((string)$a['not'], 'Film yazısı')) { $film[$a['not']] = ($film[$a['not']] ?? 0) + 1; $etiket .= ' · ' . (['', 'büyük başlık', 'alt yazı', 'düğme 1', 'düğme 2'][$film[$a['not']]] ?? ''); } ?>
            <div class="row" data-ara="<?= h(mb_strtolower($a['tr'] . ' ' . $a['en'] . ' ' . $a['de'])) ?>">
              <div class="lbl"><?= h($etiket) ?></div>
              <?php foreach (['tr' => 'TÜRKÇE', 'en' => 'ENGLISH', 'de' => 'DEUTSCH'] as $dil => $dad): ?>
                <div class="fld"><label><?= $dad ?></label><textarea name="a[<?= h($k) ?>][<?= $dil ?>]" rows="<?= $uzun > 160 ? 5 : ($uzun > 60 ? 3 : 1) ?>" data-v="<?= h($a[$dil]) ?>" lang="<?= $dil ?>"><?= h($a[$dil]) ?></textarea></div>
              <?php endforeach; ?>
            </div>
          <?php endforeach; ?>
        </div>
        <div class="bar"><button class="btn" type="submit" id="kaydet" disabled>Kaydet ve yayınla</button><span class="mut" id="say">Değişiklik yok</span></div>
      </form>
    </div>
  </div>
  <script>
  (function () {
    var f = document.getElementById('yform'), b = document.getElementById('kaydet'), say = document.getElementById('say');
    function guncelle() {
      var n = 0; f.querySelectorAll('textarea').forEach(function (t) { var c = t.value !== t.dataset.v; t.classList.toggle('chg', c); if (c) n++; });
      b.disabled = n === 0; say.textContent = n ? n + ' alan değişti' : 'Değişiklik yok';
    }
    f.addEventListener('input', guncelle);
    function boy(t) { t.style.height = 'auto'; t.style.height = (t.scrollHeight + 2) + 'px'; }
    f.querySelectorAll('textarea').forEach(function (t) { t.rows = 1; t.style.overflow = 'hidden'; boy(t); t.addEventListener('input', function () { boy(t); }); });
    window.addEventListener('resize', function () { f.querySelectorAll('textarea').forEach(boy); });
    // yalnızca değişen alanlar gönderilir
    f.addEventListener('submit', function () { f.querySelectorAll('textarea').forEach(function (t) { if (t.value === t.dataset.v) t.disabled = true; }); });
    window.addEventListener('beforeunload', function (e) { if (!b.disabled && !f.dataset.go) { e.preventDefault(); e.returnValue = ''; } });
    f.addEventListener('submit', function () { f.dataset.go = 1; });
    document.getElementById('ara').addEventListener('input', function () {
      var q = this.value.toLocaleLowerCase('tr');
      f.querySelectorAll('.row').forEach(function (r) { r.style.display = !q || r.dataset.ara.indexOf(q) > -1 ? '' : 'none'; });
    });
  })();
  </script>

<?php elseif ($s === 'ayarlar'):
    $a = gizli_ayar_yukle(); $sa = site_ayar_yukle();
?>
  <div class="card">
    <h1>E-posta ayarları</h1>
    <p class="mut">Teklif formundan gelen mesajlar bu ayarlarla gönderilir. SMTP sunucusu boş bırakılırsa sunucunun kendi e-posta servisi kullanılır.</p>
    <form method="post" action="./?s=ayarlar" autocomplete="off">
      <input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><input type="hidden" name="islem" value="eposta">
      <div class="grid2">
        <div class="f full"><label>Mesajların gideceği adres (birden fazlaysa virgülle ayırın)</label><input type="text" name="alici" value="<?= h((string)($a['alici'] ?? 'info@gkh.ro')) ?>" placeholder="info@gkh.ro"></div>
        <div class="f"><label>Gönderen adı</label><input type="text" name="gonderen_adi" value="<?= h((string)($a['gonderen_adi'] ?? 'Alufortis Web Sitesi')) ?>"></div>
        <div class="f"><label>Gönderen e-posta adresi</label><input type="email" name="gonderen_eposta" value="<?= h((string)($a['gonderen_eposta'] ?? '')) ?>" placeholder="ör. web@alufortis.com (boşsa SMTP kullanıcısı)"></div>
        <div class="f"><label>SMTP sunucusu</label><input type="text" name="smtp_sunucu" value="<?= h((string)($a['smtp_sunucu'] ?? '')) ?>" placeholder="ör. mail.alufortis.com"></div>
        <div class="f"><label>Port</label><input type="number" name="smtp_port" value="<?= h((string)($a['smtp_port'] ?? 587)) ?>" min="1" max="65535"></div>
        <div class="f"><label>Güvenlik</label><select name="smtp_guvenlik"><?php foreach (['tls' => 'STARTTLS (genellikle port 587)', 'ssl' => 'SSL/TLS (genellikle port 465)', 'yok' => 'Şifrelemesiz (önerilmez)'] as $v => $t): ?><option value="<?= $v ?>" <?= ($a['smtp_guvenlik'] ?? 'tls') === $v ? 'selected' : '' ?>><?= h($t) ?></option><?php endforeach; ?></select></div>
        <div class="f"><label>SMTP kullanıcı adı</label><input type="text" name="smtp_kullanici" value="<?= h((string)($a['smtp_kullanici'] ?? '')) ?>" autocomplete="off"></div>
        <div class="f"><label>SMTP şifresi <?= !empty($a['smtp_sifre']) ? '<span class="mut">(kayıtlı; değiştirmek için yazın)</span>' : '' ?></label><input type="password" name="smtp_sifre" value="" autocomplete="new-password"><?php if (!empty($a['smtp_sifre'])): ?><label class="mut" style="font-weight:400;margin-top:6px"><input type="checkbox" name="smtp_sifre_sil" value="1"> Kayıtlı şifreyi sil</label><?php endif; ?></div>
      </div>
      <p><button class="btn" type="submit">Kaydet</button></p>
    </form>
    <form method="post" action="./?s=ayarlar"><input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><input type="hidden" name="islem" value="deneme">
      <p class="mut">Kaydettikten sonra ayarları denemek için:</p><button class="btn sec" type="submit">Deneme e-postası gönder</button></form>
  </div>
  <div class="card">
    <h1>Ek dosya sınırı</h1>
    <p class="mut">Teklif formunda gönderilebilecek dosyaların toplam boyutu. Sitede yazan “<?= (int)$sa['maks_mb'] ?> MB” ifadeleri de birlikte güncellenir. E-posta sunucularının çoğu 25 MB üzerindeki iletileri kabul etmediği için en fazla <?= MB_EN_FAZLA ?> MB seçilebilir.</p>
    <form method="post" action="./?s=ayarlar" style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
      <input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><input type="hidden" name="islem" value="sinir">
      <div class="f" style="width:160px"><label>Toplam (MB)</label><input type="number" name="maks_mb" min="1" max="<?= MB_EN_FAZLA ?>" value="<?= (int)$sa['maks_mb'] ?>"></div>
      <button class="btn" type="submit">Kaydet ve yayınla</button>
    </form>
  </div>
  <div class="card">
    <h1>Panel şifresi</h1>
    <form method="post" action="./?s=ayarlar" autocomplete="off" class="grid2">
      <input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><input type="hidden" name="islem" value="sifre">
      <div class="f full"><label>Mevcut şifre</label><input type="password" name="eski" autocomplete="current-password" required></div>
      <div class="f"><label>Yeni şifre (en az 12 karakter)</label><input type="password" name="yeni" autocomplete="new-password" minlength="12" required></div>
      <div class="f"><label>Yeni şifre (tekrar)</label><input type="password" name="yeni2" autocomplete="new-password" minlength="12" required></div>
      <div class="full"><button class="btn" type="submit">Şifreyi değiştir</button></div>
    </form>
  </div>

<?php elseif ($s === 'gecmis'): $l = gecmis_listesi(); ?>
  <div class="card">
    <h1>Geçmiş</h1>
    <p class="mut">Her yayından önce sitenin o anki hâli saklanır (son 30 kayıt). “Geri dön” yazıları o kayıttan önceki hâline döndürür ve yayınlar.</p>
    <?php if (!$l): ?><p>Henüz kayıt yok.</p><?php else: ?>
    <table class="l">
      <?php foreach ($l as $e): $t = DateTime::createFromFormat('Y-m-d-His', substr($e, 0, 17), new DateTimeZone('UTC')); if ($t) $t->setTimezone(new DateTimeZone('Europe/Istanbul')); ?>
        <tr><td><?= h($t ? $t->format('d.m.Y H:i:s') . ' (İstanbul)' : $e) ?></td>
        <td style="text-align:right"><form method="post" action="./?s=gecmis" onsubmit="return confirm('Yazılar bu kayıttan önceki hâline döndürülüp yayınlanacak. Devam edilsin mi?')"><input type="hidden" name="csrf" value="<?= h(csrf()) ?>"><input type="hidden" name="islem" value="geri"><input type="hidden" name="etiket" value="<?= h($e) ?>"><button class="btn sec" type="submit">Geri dön</button></form></td></tr>
      <?php endforeach; ?>
    </table>
    <?php endif; ?>
  </div>
<?php endif; ?>
</div>
<?php endif; ?>
</body>
</html>
