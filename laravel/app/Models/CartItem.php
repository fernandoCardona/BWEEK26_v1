<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CartItem extends Model
{
    protected $table = 'cart_items';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'kind',
        'cart_id',
        'product_id',
        'event_ticket_type_id',
        'quantity',
        'unit_price',
    ];

    protected $casts = [
        'id' => 'string',
        'unit_price' => 'decimal:2',
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

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function ticketType()
    {
        return $this->belongsTo(EventTicketType::class, 'event_ticket_type_id');
    }
}
