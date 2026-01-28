<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProductImage extends Model
{
    protected $table = 'product_images';

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id',
        'product_id',
        'path',
        'sort_order',
    ];

    protected $casts = [
        'id' => 'string',
        'sort_order' => 'integer',
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

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
