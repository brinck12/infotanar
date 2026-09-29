<?php

namespace App\Providers;

use App\Mail\OutboxTransport;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Mail::extend('outbox', fn (array $config) => new OutboxTransport($config['path']));
    }
}
