<?php
/*
 * Alufortis teklif e-postası: kurumsal HTML şablon + düz metin, ekler, logo.
 * Gönderim: panelde SMTP girildiyse SMTP (TLS doğrulamalı), girilmediyse sunucunun mail() işlevi.
 */
declare(strict_types=1);
require_once __DIR__ . '/lib.php';
require_once __DIR__ . '/PHPMailer/Exception.php';
require_once __DIR__ . '/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

const ALICI_VARSAYILAN = 'info@gkh.ro';

/**
 * $v: ad, firma, eposta, tel, mesaj, dil ; $ekler: [['isim','yol','boyut'], ...]
 * Dönen: ['ok' => bool, 'hata' => string]
 */
function teklif_epostasi_gonder(array $v, array $ekler): array
{
    $ad = (string)$v['ad']; $firma = (string)$v['firma']; $eposta = (string)$v['eposta'];
    $tel = (string)$v['tel']; $mesaj = (string)$v['mesaj']; $dil = (string)$v['dil'];
    $toplam = 0; foreach ($ekler as $e) $toplam += (int)$e['boyut'];
    $konu = 'Teklif talebi: ' . ($firma !== '' ? $firma : $ad) . ' [' . strtoupper($dil) . ']';
    $ayar = gizli_ayar_yukle();

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
    $logo_yol = dirname(__DIR__) . '/assets/eposta-logo.png';
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

    $m = new PHPMailer(true);
    try {
        $m->CharSet = PHPMailer::CHARSET_UTF8;
        $m->Encoding = PHPMailer::ENCODING_BASE64;
        $alan_adi = preg_replace('/[^a-z0-9.-]/i', '', (string)($_SERVER['SERVER_NAME'] ?? ''));
        if (!preg_match('/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/i', $alan_adi)) $alan_adi = 'alufortis.gkh.ro';
        $gonderen_adi = trim((string)($ayar['gonderen_adi'] ?? '')) ?: 'Alufortis Web Sitesi';
        if (!empty($ayar['smtp_sunucu'])) {
            $m->isSMTP();
            $m->Host = (string)$ayar['smtp_sunucu'];
            $m->Port = (int)($ayar['smtp_port'] ?? 587);
            $guv = (string)($ayar['smtp_guvenlik'] ?? 'tls');
            $m->SMTPSecure = $guv === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : ($guv === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : '');
            $m->SMTPAutoTLS = $guv !== 'yok';
            $m->SMTPAuth = ($ayar['smtp_kullanici'] ?? '') !== '';
            $m->Username = (string)($ayar['smtp_kullanici'] ?? '');
            $m->Password = (string)($ayar['smtp_sifre'] ?? '');
            $m->Timeout = 20;
            $gonderen = (string)(($ayar['gonderen_eposta'] ?? '') ?: $m->Username);
        } else {
            $m->isMail();
            $gonderen = (string)(($ayar['gonderen_eposta'] ?? '') ?: 'noreply@' . preg_replace('/^www\./', '', $alan_adi));
        }
        $m->setFrom($gonderen, $gonderen_adi);
        $m->Sender = $gonderen;
        $alici = trim((string)($ayar['alici'] ?? '')) ?: ALICI_VARSAYILAN;
        foreach (preg_split('/[\s,;]+/', $alici, -1, PREG_SPLIT_NO_EMPTY) ?: [] as $a) $m->addAddress($a);
        if (filter_var($eposta, FILTER_VALIDATE_EMAIL)) $m->addReplyTo($eposta, $ad);
        $m->Subject = $konu;
        $m->isHTML(true);
        $m->Body = $govde_html;
        $m->AltBody = $govde_metin;
        $m->XMailer = 'Alufortis teklif formu';
        if ($logo_var) $m->addEmbeddedImage($logo_yol, 'alufortis-logo', 'alufortis-logo.png', PHPMailer::ENCODING_BASE64, 'image/png');
        foreach ($ekler as $e) $m->addAttachment($e['yol'], $e['isim']);
        $m->send();
        return ['ok' => true, 'hata' => ''];
    } catch (\Throwable $ex) {
        return ['ok' => false, 'hata' => $m->ErrorInfo ?: $ex->getMessage()];
    }
}
