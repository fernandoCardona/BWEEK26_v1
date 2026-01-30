<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Ticket extends Model
{
    protected $table = 'tickets';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'event_id',
        'event_ticket_type_id',
        'user_id',
        'transaction_id',
        'qr_code',
        'validation_hash',
        'ticket_type',
        'price',
        'status',
        'purchased_at',
        'validated_at',
        'scanned_at',
    ];

    protected $casts = [
        'id' => 'string',
        'price' => 'decimal:2',
        'purchased_at' => 'datetime',
        'validated_at' => 'datetime',
        'scanned_at' => 'datetime',
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

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function eventTicketType()
    {
        return $this->belongsTo(EventTicketType::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }
}
