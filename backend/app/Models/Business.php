<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Business extends Model
{
    use HasUuids;

    protected $fillable = ['legal_name', 'trading_name', 'registration_country', 'registration_number', 'status'];
}
