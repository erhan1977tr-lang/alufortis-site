<?php
/*
 * Alufortis teklif formu: form alanlarını ve ekleri e-posta olarak gönderir (alıcı, SMTP ve ek sınırı yönetim panelinden).
 * Ekler: istenen kadar dosya, her format, toplam sınır panelden (varsayılan 15 MB). Dosyalar sunucuda saklanmaz.
 * Spam koruması: gizli alan (website), IP başına saatte 8 gönderim.
 */
declare(strict_types=1);

require_once __DIR__ . '/yonetim/posta.php';
define('MAKS_TOPLAM', site_ayar_yukle()['maks_mb'] * 1024 * 1024);
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
$sonuc = teklif_epostasi_gonder(['ad' => $ad, 'firma' => $firma, 'eposta' => $eposta, 'tel' => $tel, 'mesaj' => $mesaj, 'dil' => $dil], $ekler);
if (!$sonuc['ok']) {
    error_log('Alufortis teklif formu gönderilemedi: ' . $sonuc['hata']);
    cevap(502, ['ok' => false, 'error' => 'mail']);
}
$gecmis[] = $simdi;
@file_put_contents($kayit, implode(',', $gecmis), LOCK_EX);
cevap(200, ['ok' => true]);
