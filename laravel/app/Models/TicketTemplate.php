<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TicketTemplate extends Model
{
    protected $table = 'ticket_templates';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'code',
        'price',
        'stock',
        'external_purchase_url',
        'image_path',
        'description',
        'legal_terms',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'price' => 'decimal:2',
        'stock' => 'integer',
        'is_active' => 'boolean',
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

    public function eventTicketTypes()
    {
        return $this->hasMany(EventTicketType::class, 'ticket_template_id');
    }
}
