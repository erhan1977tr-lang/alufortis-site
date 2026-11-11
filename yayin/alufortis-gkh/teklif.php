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

$dil_ad = ['tr' => 'Türkçe', 'en' => 'English', 'de' => 'Deutsch'][$dil];
$zaman = (new DateTime('now', new DateTimeZone('Europe/Istanbul')))->format('d.m.Y H:i');
$mb = fn(int $b): string => $b >= 1048576 ? number_format($b / 1048576, 2, ',', '.') . ' MB' : max(1, (int)round($b / 1024)) . ' KB';

// düz metin sürümü (HTML göstermeyen programlar için)
$govde_metin = "ALUFORTIS - Yeni teklif talebi\n$zaman (İstanbul)\n\n"
    . "Ad Soyad: $ad\nFirma: $firma\nE-posta: $eposta\nTelefon: $tel\nSayfa dili: $dil_ad\n\n"
    . "Kesit / ihtiyaç:\n$mesaj\n";
if ($ekler) {
    $govde_metin .= "\nEkler (" . count($ekler) . " dosya, toplam " . $mb($toplam) . "):\n";
    foreach ($ekler as $e) $govde_metin .= '- ' . $e['isim'] . ' (' . $mb($e['boyut']) . ")\n";
}
$govde_metin .= "\nBu e-postayı yanıtladığınızda yanıtınız doğrudan $eposta adresine gider.\n";

// kurumsal HTML sürümü
$h = fn(string $v): string => htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
$logo_yol = __DIR__ . '/assets/eposta-logo.png';
$logo_var = is_file($logo_yol);
$satir = function (string $etiket, string $deger) use ($h): string {
    return '<tr><td style="padding:10px 0;border-bottom:1px solid #E6EAF0;width:140px;vertical-align:top;font:600 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#6B7785">' . $h($etiket) . '</td>'
        . '<td style="padding:10px 0;border-bottom:1px solid #E6EAF0;vertical-align:top;font:15px/1.5 Arial,Helvetica,sans-serif;color:#141B24">' . ($deger !== '' ? $deger : '<span style="color:#9AA5B1">-</span>') . '</td></tr>';
};
$ek_html = '';
if ($ekler) {
    $ek_html = '<tr><td style="padding:28px 40px 0"><div style="font:700 13px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#0F141B;margin:0 0 10px">Ekler <span style="color:#6B7785;font-weight:400;letter-spacing:0;text-transform:none">(' . count($ekler) . ' dosya, toplam ' . $h($mb($toplam)) . ')</span></div>'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">';
    foreach ($ekler as $e) {
        $ek_html .= '<tr><td style="padding:9px 12px;border:1px solid #E6EAF0;border-radius:6px;font:14px/1.4 Arial,Helvetica,sans-serif;color:#141B24;background:#F7F9FB">&#128206;&nbsp; ' . $h($e['isim']) . '<span style="float:right;color:#6B7785">' . $h($mb($e['boyut'])) . '</span></td></tr><tr><td style="height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>';
    }
    $ek_html .= '</table></td></tr>';
}
$baslik_html = $logo_var
    ? '<img src="cid:alufortis-logo" width="176" height="87" alt="ALUFORTIS" style="display:block;border:0;width:176px;height:87px">'
    : '<span style="font:800 26px/1 Arial,Helvetica,sans-serif;letter-spacing:.08em;color:#FFFFFF">ALUFORTIS</span>';
$yanitla = 'mailto:' . rawurlencode($eposta) . '?subject=' . rawurlencode('Re: ' . $konu);
$govde_html = '<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $h($konu) . '</title></head>'
    . '<body style="margin:0;padding:0;background:#EEF1F5">'
    . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F5"><tr><td align="center" style="padding:28px 12px">'
    . '<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;background:#FFFFFF;border-radius:10px;overflow:hidden;border-collapse:separate">'
    . '<tr><td style="background:#0F141B;padding:26px 40px" bgcolor="#0F141B"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td>' . $baslik_html . '</td>'
    . '<td align="right" style="font:600 11px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#4CB7FF">Teklif formu</td></tr></table></td></tr>'
    . '<tr><td style="height:4px;line-height:4px;font-size:0;background:#F26B1D" bgcolor="#F26B1D">&nbsp;</td></tr>'
    . '<tr><td style="padding:34px 40px 6px"><div style="font:700 24px/1.25 Arial,Helvetica,sans-serif;color:#0F141B;margin:0 0 6px">Yeni teklif talebi</div>'
    . '<div style="font:14px/1.5 Arial,Helvetica,sans-serif;color:#6B7785">' . $h($zaman) . ' (İstanbul saati) &middot; alufortis.gkh.ro &middot; ' . $h($dil_ad) . ' sayfa</div></td></tr>'
    . '<tr><td style="padding:18px 40px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">'
    . $satir('Ad Soyad', $h($ad))
    . $satir('Firma', $h($firma))
    . $satir('E-posta', '<a href="mailto:' . $h($eposta) . '" style="color:#1F7FC4;text-decoration:none">' . $h($eposta) . '</a>')
    . $satir('Telefon', $tel !== '' ? '<a href="tel:' . $h(preg_replace('/[^0-9+]/', '', $tel) ?? '') . '" style="color:#1F7FC4;text-decoration:none">' . $h($tel) . '</a>' : '')
    . '</table></td></tr>'
    . '<tr><td style="padding:28px 40px 0"><div style="font:700 13px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#0F141B;margin:0 0 10px">Kesit / İhtiyaç</div>'
    . '<div style="padding:16px 18px;background:#F7F9FB;border-left:3px solid #4CB7FF;border-radius:4px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#141B24">' . ($mesaj !== '' ? nl2br($h($mesaj)) : '<span style="color:#9AA5B1">Mesaj yazılmadı.</span>') . '</div></td></tr>'
    . $ek_html
    . '<tr><td style="padding:30px 40px 36px"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#0F141B;border-radius:6px" bgcolor="#0F141B">'
    . '<a href="' . $h($yanitla) . '" style="display:inline-block;padding:13px 26px;font:700 14px/1 Arial,Helvetica,sans-serif;color:#FFFFFF;text-decoration:none;letter-spacing:.02em">Müşteriye yanıt ver</a></td></tr></table>'
    . '<div style="font:13px/1.5 Arial,Helvetica,sans-serif;color:#6B7785;margin-top:12px">Bu e-postayı yanıtladığınızda yanıtınız doğrudan ' . $h($eposta) . ' adresine gider.</div></td></tr>'
    . '<tr><td style="background:#0F141B;padding:20px 40px;font:12px/1.6 Arial,Helvetica,sans-serif;color:#9AA7B6" bgcolor="#0F141B">'
    . '<strong style="color:#FFFFFF;letter-spacing:.06em">ALUFORTIS</strong> &middot; Aluminium Engineering Solutions<br>Batı Mah. Hatboyu Cad. No:42/100, Pendik / İstanbul &middot; +90 (533) 418 42 45<br>'
    . '<span style="color:#6B7785">Bu ileti alufortis.gkh.ro web sitesindeki teklif formundan otomatik olarak oluşturuldu.</span></td></tr>'
    . '</table></td></tr></table></body></html>';

$sinir = '=_alufortis_m_' . bin2hex(random_bytes(10));
$sinir_r = '=_alufortis_r_' . bin2hex(random_bytes(10));
$sinir_a = '=_alufortis_a_' . bin2hex(random_bytes(10));
$basliklar = [
    'From: ' . baslik_kodla('Alufortis Web Sitesi') . " <$gonderen>",
    'Reply-To: ' . baslik_kodla($ad) . " <$eposta>",
    'MIME-Version: 1.0',
    'X-Mailer: Alufortis teklif formu',
    "Content-Type: multipart/mixed; boundary=\"$sinir\"",
];
$govde = "Bu ileti MIME biçimindedir.\r\n\r\n--$sinir\r\n"
    . "Content-Type: multipart/related; boundary=\"$sinir_r\"; type=\"multipart/alternative\"\r\n\r\n"
    . "--$sinir_r\r\nContent-Type: multipart/alternative; boundary=\"$sinir_a\"\r\n\r\n"
    . "--$sinir_a\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($govde_metin)) . "\r\n"
    . "--$sinir_a\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
    . chunk_split(base64_encode($govde_html)) . "\r\n"
    . "--$sinir_a--\r\n";
if ($logo_var) {
    $govde .= "--$sinir_r\r\nContent-Type: image/png; name=\"alufortis-logo.png\"\r\nContent-Transfer-Encoding: base64\r\n"
        . "Content-ID: <alufortis-logo>\r\nContent-Disposition: inline; filename=\"alufortis-logo.png\"\r\n\r\n"
        . chunk_split(base64_encode((string)file_get_contents($logo_yol))) . "\r\n";
}
$govde .= "--$sinir_r--\r\n";
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

$tamam = @mail(ALICI, baslik_kodla($konu), $govde, implode("\r\n", $basliklar), '-f' . $gonderen);
if (!$tamam) {
    cevap(502, ['ok' => false, 'error' => 'mail']);
}
$gecmis[] = $simdi;
@file_put_contents($kayit, implode(',', $gecmis), LOCK_EX);
cevap(200, ['ok' => true]);
