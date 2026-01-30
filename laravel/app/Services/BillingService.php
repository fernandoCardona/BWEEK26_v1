<?php

namespace App\Services;

use App\Models\BillingDocument;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class BillingService
{
    public function ensureProformaForTransaction(Transaction $tx, array $linesSnapshot): BillingDocument
    {
        $existing = $tx->billingDocument;
        if ($existing && $existing->kind === 'proforma') {
            return $existing;
        }

        if ($existing) {
            $existing->delete();
        }

        return DB::transaction(function () use ($tx, $linesSnapshot) {
            $year = (int) ($tx->created_at?->format('Y') ?? now()->format('Y'));
            $sequence = $this->nextSequence('proforma', $year);
            $series = (string) config('billing.series.proforma', 'PF');
            $number = $this->formatNumber($series, $year, $sequence);

            $vatRate = (float) config('billing.vat_rate', 21.0);
            [$subtotal, $vatAmount, $total] = $this->computeTotalsFromLines($linesSnapshot, $vatRate);

            return BillingDocument::create([
                'transaction_id' => $tx->id,
                'user_id' => $tx->user_id,
                'kind' => 'proforma',
                'series' => $series,
                'year' => $year,
                'sequence' => $sequence,
                'number' => $number,
                'issued_at' => now(),
                'currency' => $tx->currency ?? 'EUR',
                'vat_rate' => $vatRate,
                'subtotal_amount' => $subtotal,
                'vat_amount' => $vatAmount,
                'total_amount' => $total,
                'issuer' => config('billing.issuer', []),
                'recipient' => $this->recipientSnapshot($tx),
                'lines' => $this->enrichLinesWithVat($linesSnapshot, $vatRate),
            ]);
        });
    }

    public function issueInvoiceForTransaction(Transaction $tx): ?BillingDocument
    {
        if (!in_array(strtolower((string) $tx->status), ['completed', 'success'], true)) {
            return null;
        }

        return DB::transaction(function () use ($tx) {
            $tx->loadMissing(['items', 'user', 'billingDocument']);

            $vatRate = (float) config('billing.vat_rate', 21.0);
            $year = (int) ($tx->created_at?->format('Y') ?? now()->format('Y'));
            $series = (string) config('billing.series.invoice', 'F');

            $lines = $this->linesFromTransaction($tx);
            [$subtotal, $vatAmount, $total] = $this->computeTotalsFromLines($lines, $vatRate);

            $doc = $tx->billingDocument;
            if ($doc) {
                if ($doc->kind === 'invoice') {
                    return $doc;
                }

                $sequence = $this->nextSequence('invoice', $year);
                $doc->fill([
                    'kind' => 'invoice',
                    'series' => $series,
                    'year' => $year,
                    'sequence' => $sequence,
                    'number' => $this->formatNumber($series, $year, $sequence),
                    'issued_at' => now(),
                    'currency' => $tx->currency ?? 'EUR',
                    'vat_rate' => $vatRate,
                    'subtotal_amount' => $subtotal,
                    'vat_amount' => $vatAmount,
                    'total_amount' => $total,
                    'issuer' => config('billing.issuer', []),
                    'recipient' => $this->recipientSnapshot($tx),
                    'lines' => $this->enrichLinesWithVat($lines, $vatRate),
                ])->save();

                return $doc->refresh();
            }

            $sequence = $this->nextSequence('invoice', $year);
            return BillingDocument::create([
                'transaction_id' => $tx->id,
                'user_id' => $tx->user_id,
                'kind' => 'invoice',
                'series' => $series,
                'year' => $year,
                'sequence' => $sequence,
                'number' => $this->formatNumber($series, $year, $sequence),
                'issued_at' => now(),
                'currency' => $tx->currency ?? 'EUR',
                'vat_rate' => $vatRate,
                'subtotal_amount' => $subtotal,
                'vat_amount' => $vatAmount,
                'total_amount' => $total,
                'issuer' => config('billing.issuer', []),
                'recipient' => $this->recipientSnapshot($tx),
                'lines' => $this->enrichLinesWithVat($lines, $vatRate),
            ]);
        });
    }

    private function nextSequence(string $kind, int $year): int
    {
        $row = DB::table('billing_counters')
            ->where('kind', $kind)
            ->where('year', $year)
            ->lockForUpdate()
            ->first();

        if (!$row) {
            DB::table('billing_counters')->insert([
                'kind' => $kind,
                'year' => $year,
                'next_sequence' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return 1;
        }

        $seq = (int) ($row->next_sequence ?? 1);
        DB::table('billing_counters')
            ->where('id', $row->id)
            ->update([
                'next_sequence' => $seq + 1,
                'updated_at' => now(),
            ]);

        return $seq;
    }

    private function formatNumber(string $series, int $year, int $sequence): string
    {
        return strtoupper($series) . '-' . $year . '-' . str_pad((string) $sequence, 6, '0', STR_PAD_LEFT);
    }

    private function linesFromTransaction(Transaction $tx): array
    {
        $lines = [];
        foreach (($tx->items ?? []) as $it) {
            $lines[] = [
                'kind' => (string) ($it->kind ?? ''),
                'description' => (string) ($it->title ?? 'Item'),
                'quantity' => (int) ($it->quantity ?? 0),
                'unit_price' => (float) ($it->unit_price ?? 0),
                'total' => (float) ($it->total_price ?? 0),
                'meta' => $it->meta ?? null,
            ];
        }
        return $lines;
    }

    private function recipientSnapshot(Transaction $tx): array
    {
        $u = $tx->relationLoaded('user') ? $tx->user : $tx->user()->first();
        if (!$u) return [];
        return [
            'name' => trim((string) ($u->name ?? '')),
            'last_name' => trim((string) ($u->last_name ?? '')),
            'email' => (string) ($u->email ?? ''),
            'phone' => (string) ($u->phone ?? ''),
            'address_line1' => (string) ($u->address_line1 ?? ''),
            'address_line2' => (string) ($u->address_line2 ?? ''),
            'postal_code' => (string) ($u->postal_code ?? ''),
            'city' => (string) ($u->city ?? ''),
            'country' => (string) ($u->country ?? ''),
        ];
    }

    private function computeTotalsFromLines(array $lines, float $vatRate): array
    {
        $gross = 0.0;
        foreach ($lines as $l) {
            $gross += (float) ($l['total'] ?? 0);
        }
        $rate = max(0.0, $vatRate) / 100.0;
        $subtotal = $rate > 0 ? ($gross / (1.0 + $rate)) : $gross;
        $vatAmount = $gross - $subtotal;
        return [round($subtotal, 2), round($vatAmount, 2), round($gross, 2)];
    }

    private function enrichLinesWithVat(array $lines, float $vatRate): array
    {
        $rate = max(0.0, $vatRate) / 100.0;
        return array_map(function ($l) use ($rate, $vatRate) {
            $total = (float) ($l['total'] ?? 0);
            $base = $rate > 0 ? ($total / (1.0 + $rate)) : $total;
            $vat = $total - $base;
            return [
                ...$l,
                'vat_rate' => round($vatRate, 2),
                'base' => round($base, 2),
                'vat' => round($vat, 2),
            ];
        }, $lines);
    }
}

