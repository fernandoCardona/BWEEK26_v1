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
        'name',
        'description',
        'event_date',
        'location',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'id' => 'string',
        'name' => 'json',
        'description' => 'json',
        'location' => 'json',
        'event_date' => 'datetime',
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
}
