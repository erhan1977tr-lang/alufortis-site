<?php
/*
 * Alufortis teklif formu: form alanlarını ve ekleri info@gkh.ro adresine e-posta olarak gönderir.
 * Ekler: istenen kadar dosya, her format, toplam en fazla 15 MB. Dosyalar sunucuda saklanmaz.
 * Spam koruması: gizli alan (website), IP başına saatte 8 gönderim.
 */
declare(strict_types=1);

const ALICI = 'info@gkh.ro';
const MAKS_TOPLAM = 15 * 1024 * 1024;
const SAATLIK_SINIR = 8;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function cevap(int $kod, array $veri): void
{
    http_response_code($kod);
    echo json_encode($veri, JSON_UNESCAPED_UNICODE);
    exit;
}

function alan(string $ad, int $maks = 200): string
{
    $v = isset($_POST[$ad]) && is_string($_POST[$ad]) ? $_POST[$ad] : '';
    $v = str_replace("\0", '', $v);
    $v = trim($v);
    return function_exists('mb_substr') ? mb_substr($v, 0, $maks, 'UTF-8') : substr($v, 0, $maks);
}

function tek_satir(string $v): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $v) ?? '');
}

function baslik_kodla(string $v): string
{
    return '=?UTF-8?B?' . base64_encode($v) . '?=';
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    cevap(405, ['ok' => false, 'error' => 'method']);
}

// içerik sunucunun izin verdiğinden büyükse PHP $_POST'u boş bırakır
$uzunluk = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($uzunluk > MAKS_TOPLAM + 2 * 1024 * 1024 || (empty($_POST) && $uzunluk > 0)) {
    cevap(413, ['ok' => false, 'error' => 'too_large']);
}

// bot tuzağı: insanlar bu alanı görmez
if (alan('website') !== '') {
    cevap(200, ['ok' => true]);
}

$ad = tek_satir(alan('ad', 120));
$firma = tek_satir(alan('firma', 160));
$eposta = tek_satir(alan('eposta', 160));
$tel = tek_satir(alan('tel', 60));
$mesaj = alan('mesaj', 8000);
$dil = in_array(alan('dil', 5), ['tr', 'en', 'de'], true) ? alan('dil', 5) : 'tr';

if ($ad === '' || !filter_var($eposta, FILTER_VALIDATE_EMAIL)) {
    cevap(422, ['ok' => false, 'error' => 'fields']);
}

// IP başına basit sınır
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$kayit = rtrim(sys_get_temp_dir(), '/') . '/alufortis-form-' . hash('sha256', $ip . '|alufortis');
$simdi = time();
$gecmis = [];
if (is_file($kayit)) {
    $gecmis = array_filter(array_map('intval', explode(',', (string)@file_get_contents($kayit))), fn($t) => $t > $simdi - 3600);
}
if (count($gecmis) >= SAATLIK_SINIR) {
    cevap(429, ['ok' => false, 'error' => 'rate']);
}

// ekler
$ekler = [];
$toplam = 0;
if (isset($_FILES['dosya']) && is_array($_FILES['dosya']['name'] ?? null)) {
    $f = $_FILES['dosya'];
    foreach ($f['name'] as $i => $isim) {
        $hata = (int)$f['error'][$i];
        if ($hata === UPLOAD_ERR_NO_FILE) continue;
        if ($hata === UPLOAD_ERR_INI_SIZE || $hata === UPLOAD_ERR_FORM_SIZE) cevap(413, ['ok' => false, 'error' => 'too_large']);
        if ($hata !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'][$i])) cevap(400, ['ok' => false, 'error' => 'upload']);
        $boyut = (int)$f['size'][$i];
        $toplam += $boyut;
        if ($toplam > MAKS_TOPLAM) cevap(413, ['ok' => false, 'error' => 'too_large']);
        $temiz = preg_replace('/[\x00-\x1F\x7F"\\\\\/]+/u', '_', basename((string)$isim)) ?: 'dosya';
        $ekler[] = ['isim' => $temiz, 'yol' => $f['tmp_name'][$i], 'boyut' => $boyut];
    }
}

// e-posta
$alan_adi = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['SERVER_NAME'] ?? 'alufortis.gkh.ro')) ?: 'alufortis.gkh.ro';
$gonderen = 'noreply@' . preg_replace('/^www\./', '', $alan_adi);
$konu = 'Teklif talebi: ' . ($firma !== '' ? $firma : $ad) . ' [' . strtoupper($dil) . ']';

$govde_metin = "Web sitesindeki teklif formundan yeni bir mesaj var.\n\n"
    . "Ad Soyad: $ad\nFirma: $firma\nE-posta: $eposta\nTelefon: $tel\nSayfa dili: " . strtoupper($dil) . "\n\n"
    . "Kesit / ihtiyaç:\n$mesaj\n";
if ($ekler) {
    $govde_metin .= "\nEkler (" . count($ekler) . " dosya, toplam " . number_format($toplam / 1048576, 2, ',', '.') . " MB):\n";
    foreach ($ekler as $e) $govde_metin .= '- ' . $e['isim'] . "\n";
}
$govde_metin .= "\nYanıtla tuşu doğrudan ziyaretçiye yazar.\n";

$sinir = '=_alufortis_' . bin2hex(random_bytes(12));
$basliklar = [
    'From: ' . baslik_kodla('Alufortis Web Sitesi') . " <$gonderen>",
    'Reply-To: ' . baslik_kodla($ad) . " <$eposta>",
    'MIME-Version: 1.0',
    'X-Mailer: Alufortis teklif formu',
];

if ($ekler) {
    $basliklar[] = "Content-Type: multipart/mixed; boundary=\"$sinir\"";
    $govde = "Bu ileti MIME biçimindedir.\r\n\r\n--$sinir\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($govde_metin)) . "\r\n";
    foreach ($ekler as $e) {
        $icerik = file_get_contents($e['yol']);
        if ($icerik === false) cevap(500, ['ok' => false, 'error' => 'read']);
        $tur = 'application/octet-stream';
        if (function_exists('finfo_open')) {
            $fi = finfo_open(FILEINFO_MIME_TYPE);
            $t = $fi ? finfo_file($fi, $e['yol']) : false;
            if ($t && preg_match('#^[\w.+-]+/[\w.+-]+$#', $t)) $tur = $t;
        }
        $isim_kod = baslik_kodla($e['isim']);
        $isim_rfc = "UTF-8''" . rawurlencode($e['isim']);
        $govde .= "--$sinir\r\nContent-Type: $tur; name=\"$isim_kod\"\r\n"
            . "Content-Transfer-Encoding: base64\r\n"
            . "Content-Disposition: attachment; filename=\"$isim_kod\"; filename*=$isim_rfc\r\n\r\n"
            . chunk_split(base64_encode($icerik)) . "\r\n";
    }
    $govde .= "--$sinir--\r\n";
} else {
    $basliklar[] = 'Content-Type: text/plain; charset=UTF-8';
    $basliklar[] = 'Content-Transfer-Encoding: base64';
    $govde = chunk_split(base64_encode($govde_metin));
}

$tamam = @mail(ALICI, baslik_kodla($konu), $govde, implode("\r\n", $basliklar), '-f' . $gonderen);
if (!$tamam) {
    cevap(502, ['ok' => false, 'error' => 'mail']);
}
$gecmis[] = $simdi;
@file_put_contents($kayit, implode(',', $gecmis), LOCK_EX);
cevap(200, ['ok' => true]);
