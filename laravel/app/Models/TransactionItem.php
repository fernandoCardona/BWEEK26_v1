<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TransactionItem extends Model
{
    protected $table = 'transaction_items';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'transaction_id',
        'kind',
        'ticket_id',
        'product_id',
        'title',
        'quantity',
        'unit_price',
        'total_price',
        'meta',
    ];

    protected $casts = [
        'id' => 'string',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
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

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}

