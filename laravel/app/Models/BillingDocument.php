<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class BillingDocument extends Model
{
    protected $table = 'billing_documents';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'transaction_id',
        'user_id',
        'kind',
        'series',
        'year',
        'sequence',
        'number',
        'issued_at',
        'currency',
        'vat_rate',
        'subtotal_amount',
        'vat_amount',
        'total_amount',
        'issuer',
        'recipient',
        'lines',
        'meta',
    ];

    protected $casts = [
        'id' => 'string',
        'year' => 'integer',
        'sequence' => 'integer',
        'issued_at' => 'datetime',
        'vat_rate' => 'decimal:2',
        'subtotal_amount' => 'decimal:2',
        'vat_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'issuer' => 'json',
        'recipient' => 'json',
        'lines' => 'json',
        'meta' => 'json',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

