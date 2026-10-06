<?php

declare(strict_types=1);

namespace App\Services\Billing\Szamlazz;

use App\Enums\CustomerType;
use App\Models\Invoice;
use DOMDocument;
use DOMElement;

/**
 * A Szamla Agent XML-keresei (ADR 0002). Az elemek sorrendje az Agent
 * XSD-jet koveti (sequence), ezert nem szabad atrendezni; minden szoveg
 * DOM-on at kerul be, igy a vevo adatai nem torhetik el az XML-t.
 */
final class InvoiceXml
{
    private const NS_INVOICE = 'http://www.szamlazz.hu/xmlszamla';

    private const NS_QUERY = 'http://www.szamlazz.hu/xmlszamlaxml';

    private const NS_PDF = 'http://www.szamlazz.hu/xmlszamlapdf';

    /** Az Agent adoalany-kodjai: belfoldi AFA-alany, illetve nem AFA-alany (maganszemely). */
    private const TAXPAYER_DOMESTIC = '7';

    private const TAXPAYER_NONE = '-1';

    /** @param array{prefix: string|null, item_name: string, unit: string} $options */
    public static function issue(Invoice $invoice, string $agentKey, string $orderNumber, InvoiceDates $dates, array $options): string
    {
        [$doc, $root] = self::document('xmlszamla', self::NS_INVOICE);
        $buyer = $invoice->buyer;

        self::children($doc, self::child($doc, $root, 'beallitasok'), [
            'szamlaagentkulcs' => $agentKey,
            'eszamla' => 'true',
            'szamlaLetoltes' => 'true',
            'valaszVerzio' => '1',
        ]);

        self::children($doc, self::child($doc, $root, 'fejlec'), array_filter([
            'keltDatum' => $dates->issued,
            'teljesitesDatum' => $dates->fulfilled,
            // Kartyaval mar kifizetve (fizetve=true): a hatarido a kelt napja, nem korabbi.
            'fizetesiHataridoDatum' => $dates->issued,
            'fizmod' => 'Bankkártya',
            'penznem' => $invoice->currency,
            'szamlaNyelve' => 'hu',
            'rendelesSzam' => $orderNumber,
            'szamlaszamElotag' => $options['prefix'],
            'fizetve' => 'true',
        ], static fn (?string $value): bool => $value !== null && $value !== ''));

        self::child($doc, $root, 'elado');

        $isCompany = $buyer['customer_type'] === CustomerType::Company->value;
        self::children($doc, self::child($doc, $root, 'vevo'), array_filter([
            'nev' => $buyer['name'],
            'orszag' => $buyer['country'] === 'HU' ? 'Magyarország' : $buyer['country'],
            'irsz' => $buyer['postal_code'],
            'telepules' => $buyer['city'],
            'cim' => $buyer['address_line'],
            'email' => $buyer['email'],
            'sendEmail' => 'true',
            'adoalany' => $isCompany ? self::TAXPAYER_DOMESTIC : self::TAXPAYER_NONE,
            'adoszam' => $isCompany ? $buyer['tax_number'] : null,
        ], static fn (?string $value): bool => $value !== null && $value !== ''));

        $item = self::child($doc, self::child($doc, $root, 'tetelek'), 'tetel');
        self::children($doc, $item, [
            'megnevezes' => $options['item_name'],
            'mennyiseg' => '1',
            'mennyisegiEgyseg' => $options['unit'],
            'nettoEgysegar' => (string) $invoice->net_amount,
            'afakulcs' => $invoice->vat_rate,
            'nettoErtek' => (string) $invoice->net_amount,
            'afaErtek' => (string) $invoice->vat_amount,
            'bruttoErtek' => (string) $invoice->gross_amount,
        ]);

        return self::save($doc);
    }

    /** Szamla keresese rendelesszam alapjan (bizonytalan kiallitas utan). */
    public static function queryByOrderNumber(string $agentKey, string $orderNumber): string
    {
        [$doc, $root] = self::document('xmlszamlaxml', self::NS_QUERY);
        self::children($doc, $root, [
            'szamlaagentkulcs' => $agentKey,
            'rendelesSzam' => $orderNumber,
            'pdf' => 'false',
        ]);

        return self::save($doc);
    }

    public static function pdf(string $agentKey, string $invoiceNumber): string
    {
        [$doc, $root] = self::document('xmlszamlapdf', self::NS_PDF);
        self::children($doc, $root, [
            'szamlaagentkulcs' => $agentKey,
            'szamlaszam' => $invoiceNumber,
            'valaszVerzio' => '1',
        ]);

        return self::save($doc);
    }

    /** @return array{DOMDocument, DOMElement} */
    private static function document(string $rootName, string $namespace): array
    {
        $doc = new DOMDocument('1.0', 'UTF-8');
        $root = $doc->createElementNS($namespace, $rootName);
        $doc->appendChild($root);

        return [$doc, $root];
    }

    private static function child(DOMDocument $doc, DOMElement $parent, string $name): DOMElement
    {
        $element = $doc->createElementNS((string) $parent->namespaceURI, $name);
        $parent->appendChild($element);

        return $element;
    }

    /** @param array<string, string|null> $values */
    private static function children(DOMDocument $doc, DOMElement $parent, array $values): void
    {
        foreach ($values as $name => $value) {
            self::child($doc, $parent, $name)->appendChild($doc->createTextNode((string) $value));
        }
    }

    private static function save(DOMDocument $doc): string
    {
        $xml = $doc->saveXML();

        return $xml === false ? '' : $xml;
    }
}
