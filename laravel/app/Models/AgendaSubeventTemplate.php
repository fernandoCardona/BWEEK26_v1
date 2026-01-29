<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AgendaSubeventTemplate extends Model
{
    protected $table = 'agenda_subevent_templates';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'description',
        'agenda_location_id',
        'location',
        'address',
        'google_maps_url',
        'external_ticket_url',
        'default_start_time',
        'default_end_time',
        'tickets_enabled',
        'ticket_code',
        'ticket_price',
        'ticket_stock',
        'ticket_external_purchase_url',
        'ticket_image_path',
        'ticket_description',
        'ticket_legal_terms',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'name' => 'json',
        'description' => 'json',
        'location' => 'json',
        'tickets_enabled' => 'boolean',
        'is_active' => 'boolean',
        'ticket_price' => 'decimal:2',
        'default_start_time' => 'string',
        'default_end_time' => 'string',
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

    public function agendaLocation()
    {
        return $this->belongsTo(AgendaLocation::class, 'agenda_location_id');
    }
}

