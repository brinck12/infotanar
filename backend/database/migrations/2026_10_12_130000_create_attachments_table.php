<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Feladathoz vagy vizsgahoz csatolt fajlok (forrasfajl, tesztesetenkenti
 * bemenet, mintakep, mintamegoldas, vizsga forras-zip).
 *
 * A fajl a privat `exercise_files` tarolon van, az adatbazis csak a leirojat
 * tartja. A tulajdonos polimorf (morph alias: exercise, exam), ezert nincs ra
 * idegen kulcs: a feladat es a vizsga torlese kifejezetten torli a
 * csatolmanyokat a fajljaikkal egyutt (ManageAttachment::deleteAllFor).
 *
 * A "ne legyen ket azonos nevu fajl" szabalyt az Action ervenyesiti a
 * tulajdonos soranak zarolasa alatt, nem egyedi index: a NULL test_case_id
 * kijatszana, es a MySQL kis-nagybetu-fuggetlen, az SQLite nem.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table): void {
            $table->id();
            $table->string('attachable_type', 32);
            $table->unsignedBigInteger('attachable_id');
            // Csak az `input` szerepnel: melyik teszteset sajat fajlja.
            $table->foreignId('test_case_id')->nullable()->constrained()->cascadeOnDelete();
            $table->string('role', 24);
            // A nyilvanos fajlnev; a tarolasi utvonal soha nem ebbol kepzodik.
            $table->string('name', 100);
            $table->string('path', 255);
            $table->unsignedInteger('size');
            $table->char('sha256', 64);
            // A tartalombol megallapitott (finfo) tipus, nem a kliens allitasa.
            $table->string('mime', 100);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['attachable_type', 'attachable_id', 'role', 'position'], 'attachments_owner_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
