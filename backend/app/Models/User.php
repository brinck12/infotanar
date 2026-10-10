<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\Role;
use App\Enums\SubscriptionStatus;
use App\Notifications\ResetPasswordNotification;
use App\Notifications\VerifyEmailNotification;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * A `role` szandekosan nincs a $fillable-ben: csak forceFill-lel (admin
 * parancs, seeder) allithato, a kliens nem adhatja meg magának.
 *
 * @property Role $role
 * @property CarbonImmutable|Carbon|null $email_verified_at
 */
final class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /** @var list<string> */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /** @var list<string> */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /** @var array<string, mixed> */
    protected $attributes = [
        'role' => 'student',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === Role::Admin;
    }

    /** @return HasMany<Submission, $this> */
    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    /** @return HasMany<LessonCompletion, $this> */
    public function lessonCompletions(): HasMany
    {
        return $this->hasMany(LessonCompletion::class);
    }

    /** @return HasMany<Subscription, $this> */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Az egyetlen elo (active/past_due) elofizetes, ha van.
     *
     * @return HasOne<Subscription, $this>
     */
    public function liveSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->ofMany(
            ['id' => 'max'],
            static fn (Builder $query) => $query->whereIn('status', SubscriptionStatus::live()),
        );
    }

    /** @return HasOne<BillingProfile, $this> */
    public function billingProfile(): HasOne
    {
        return $this->hasOne(BillingProfile::class);
    }

    /** @return HasMany<Invoice, $this> */
    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    /** @return HasMany<Payment, $this> */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /** @return HasMany<AccessGrant, $this> */
    public function accessGrants(): HasMany
    {
        return $this->hasMany(AccessGrant::class);
    }

    /** @return HasMany<Consent, $this> */
    public function consents(): HasMany
    {
        return $this->hasMany(Consent::class);
    }

    /**
     * Az ervenyes kezi hozzaferes (#51), ha van.
     *
     * @return HasOne<AccessGrant, $this>
     */
    public function activeAccessGrant(): HasOne
    {
        return $this->hasOne(AccessGrant::class)->ofMany(
            ['id' => 'max'],
            static fn (Builder $query) => $query->whereNull('revoked_at')
                ->where(static fn (Builder $q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now())),
        );
    }

    /**
     * A premium tartalomhoz valo hozzaferes egyetlen igazsagforrasa (#23 gate):
     * rendben levo elofizetes VAGY ervenyes kezi hozzaferes (osztondij,
     * tamogatas - a szamlazastol fuggetlenul).
     */
    public function hasPremiumAccess(): bool
    {
        return ($this->liveSubscription?->grantsAccess() ?? false)
            || ($this->activeAccessGrant?->isActive() ?? false);
    }

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmailNotification);
    }

    /** @param  string  $token */
    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
