<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class UserGroup extends Model
{
    protected $fillable = [
        'name',
        'description',
    ];

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_group_members');
    }

    public function costCenters(): BelongsToMany
    {
        return $this->belongsToMany(CostCenter::class, 'user_group_cost_centers');
    }
}
