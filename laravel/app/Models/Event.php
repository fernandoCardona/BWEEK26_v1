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
}
