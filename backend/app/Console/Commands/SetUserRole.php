<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;

class SetUserRole extends Command
{
    protected $signature = 'user:role {email} {role : student|admin}';

    protected $description = 'Egy felhasználó szerepkörének beállítása (pl. az első admin létrehozásához)';

    public function handle(): int
    {
        $role = Role::tryFrom((string) $this->argument('role'));
        if (! $role) {
            $this->error('Ismeretlen szerepkör. Lehetséges: '.implode(', ', array_column(Role::cases(), 'value')));

            return self::FAILURE;
        }

        $user = User::where('email', mb_strtolower((string) $this->argument('email')))->first();
        if (! $user) {
            $this->error('Nincs ilyen felhasználó.');

            return self::FAILURE;
        }

        $user->forceFill(['role' => $role])->save();
        $this->info("{$user->email} szerepköre: {$role->value}");

        return self::SUCCESS;
    }
}
