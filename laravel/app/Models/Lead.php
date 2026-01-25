<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Lead extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'email',
        'phone',
        'source',
        'interest',
        'status',
        'lead_score',
        'engagement_count',
        'nurturing_count',
        'last_interaction',
        'converted_to_user_id',
        'metadata',
    ];

    protected $casts = [
        'id' => 'string',
        'metadata' => 'json',
        'last_interaction' => 'datetime',
        'lead_score' => 'integer',
        'engagement_count' => 'integer',
        'nurturing_count' => 'integer',
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

    public function user()
    {
        return $this->belongsTo(User::class, 'converted_to_user_id');
    }
}
