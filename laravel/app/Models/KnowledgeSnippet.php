<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class KnowledgeSnippet extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'source_type', // Page, Product, Event, Manual
        'source_id',
        'title',
        'content',
        'locale',
        'hash', // To detect changes
        'indexed_at',
    ];

    protected $casts = [
        'id' => 'string',
        'indexed_at' => 'datetime',
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
