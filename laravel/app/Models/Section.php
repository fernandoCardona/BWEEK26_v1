<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Section extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'page_id',
        'type',
        'order',
        'config',
    ];

    protected $casts = [
        'id' => 'string',
        'config' => 'json',
        'order' => 'integer',
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

    public function page()
    {
        return $this->belongsTo(Page::class);
    }
}
