<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Permission extends Model
{
    protected $fillable = ['key', 'description', 'is_sensitive'];

    protected function casts(): array
    {
        return ['is_sensitive' => 'boolean'];
    }
}
