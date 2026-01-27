<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Event extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'parent_event_id',
        'name',
        'description',
        'event_date',
        'start_at',
        'end_at',
        'location',
        'address',
        'google_maps_url',
        'external_ticket_url',
        'sort_order',
        'media_folder',
        'disabled_days',
        'capacity',
        'is_active',
        'banner_path',
        'logo_path',
        'flyer_path',
    ];

    protected $casts = [
        'id' => 'string',
        'name' => 'json',
        'description' => 'json',
        'location' => 'json',
        'event_date' => 'datetime',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'is_active' => 'boolean',
        'disabled_days' => 'json',
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

    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    public function ticketTypes()
    {
        return $this->hasMany(EventTicketType::class);
    }

    public function parent()
    {
        return $this->belongsTo(Event::class, 'parent_event_id');
    }

    public function subevents()
    {
        return $this->hasMany(Event::class, 'parent_event_id');
    }

    public function sponsors()
    {
        return $this->hasMany(EventSponsor::class);
    }

    public function programItems()
    {
        return $this->hasMany(EventProgramItem::class);
    }
}
