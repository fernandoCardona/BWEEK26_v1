<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class AgendaLocation extends Model
{
    protected $table = 'agenda_locations';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'location',
        'address',
        'google_maps_url',
        'notes',
        'lat',
        'lng',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'name' => 'json',
        'location' => 'json',
        'lat' => 'float',
        'lng' => 'float',
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
}
