<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;
use Illuminate\Support\Str;

class Page extends Model
{
    use HasTranslations;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'slug',
        'title',
        'meta_description',
        'is_published',
    ];

    public $translatable = ['title', 'meta_description'];

    protected $casts = [
        'id' => 'string',
        'is_published' => 'boolean',
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

    public function sections()
    {
        return $this->hasMany(Section::class)->orderBy('order');
    }
}
