<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasTranslations;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'name',
        'description',
        'price',
        'category',
        'is_active',
    ];

    public $translatable = ['name', 'description'];

    protected $casts = [
        'id' => 'string',
        'price' => 'decimal:2',
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

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);
    }
}
