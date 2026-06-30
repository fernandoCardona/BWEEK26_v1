<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminEventsCrudTest extends TestCase
{
    use DatabaseMigrations;

    public function test_admin_can_update_event_and_persist_logo(): void
    {
        Storage::fake('public');

        $admin = new User();
        $admin->fill([
            'name' => 'Admin',
            'email' => 'admin2@example.com',
            'password' => 'password1234',
        ]);
        $admin->forceFill(['legacy_role' => 'super_admin', 'is_active' => true])->save();
        $admin->syncAppRole('super_admin');

        $event = new Event();
        $event->fill([
            'name' => ['es' => 'Evento Test'],
            'description' => ['es' => 'Desc'],
            'event_date' => now()->setTime(12, 0, 0),
            'start_at' => now()->setTime(10, 0, 0),
            'end_at' => now()->setTime(12, 0, 0),
            'address' => 'Addr',
            'location' => ['es' => 'Sitges, España'],
            'is_active' => true,
        ]);
        $event->save();

        $file = UploadedFile::fake()->image('logo.webp', 200, 200);

        $response = $this->withSession(['_token' => 'test-token'])->actingAs($admin)->post(route('admin.events.update', $event->id), [
            '_token' => 'test-token',
            '_method' => 'PATCH',
            'name' => 'Evento Test',
            'description' => 'Desc',
            'address' => 'Addr',
            'location' => 'Sitges, España',
            'google_maps_url' => '',
            'external_ticket_url' => '',
            'start_date' => now()->format('d-m-Y'),
            'end_date' => now()->format('d-m-Y'),
            'start_time' => '10:00:00',
            'end_time' => '12:00:00',
            'is_active' => 1,
            'logo' => $file,
        ]);

        $response->assertStatus(302);
        $event->refresh();

        $this->assertNotNull($event->logo_path);
        Storage::disk('public')->assertExists($event->logo_path);
    }

    public function test_admin_can_delete_day_and_it_removes_subevents(): void
    {
        $admin = new User();
        $admin->fill([
            'name' => 'Admin',
            'email' => 'admin3@example.com',
            'password' => 'password1234',
        ]);
        $admin->forceFill(['legacy_role' => 'super_admin', 'is_active' => true])->save();
        $admin->syncAppRole('super_admin');

        $event = new Event();
        $event->fill([
            'name' => ['es' => 'Evento Test'],
            'description' => ['es' => 'Desc'],
            'event_date' => now()->setTime(12, 0, 0),
            'start_at' => now()->setTime(0, 0, 0),
            'end_at' => now()->addDays(2)->setTime(23, 59, 0),
            'address' => 'Addr',
            'location' => ['es' => 'Sitges, España'],
            'is_active' => true,
        ]);
        $event->save();

        $day = now()->addDay()->format('Y-m-d');

        $sub = new Event();
        $sub->fill([
            'parent_event_id' => $event->id,
            'name' => ['es' => 'Sub 1'],
            'description' => ['es' => ''],
            'event_date' => now()->addDay()->setTime(12, 0, 0),
            'start_at' => null,
            'end_at' => null,
            'address' => 'Addr',
            'location' => ['es' => 'Sitges, España'],
            'is_active' => true,
        ]);
        $sub->save();

        $this->assertSame(1, Event::query()->where('parent_event_id', $event->id)->count());

        $response = $this->withSession(['_token' => 'test-token'])->actingAs($admin)->delete(route('admin.events.days.destroy', [$event->id, $day]), [
            '_token' => 'test-token',
        ]);

        $response->assertStatus(302);
        $this->assertSame(0, Event::query()->where('parent_event_id', $event->id)->count());
    }

    public function test_admin_can_create_multiple_ticket_types_with_images(): void
    {
        Storage::fake('public');

        $admin = new User();
        $admin->fill([
            'name' => 'Admin',
            'email' => 'admin4@example.com',
            'password' => 'password1234',
        ]);
        $admin->forceFill(['legacy_role' => 'super_admin', 'is_active' => true])->save();
        $admin->syncAppRole('super_admin');

        $event = new Event();
        $event->fill([
            'name' => ['es' => 'Evento Tickets'],
            'description' => ['es' => 'Desc'],
            'event_date' => now()->setTime(12, 0, 0),
            'start_at' => now()->setTime(10, 0, 0),
            'end_at' => now()->setTime(12, 0, 0),
            'address' => 'Addr',
            'location' => ['es' => 'Sitges, España'],
            'is_active' => true,
        ]);
        $event->save();

        $file1 = UploadedFile::fake()->image('vip.webp', 200, 200);
        $file2 = UploadedFile::fake()->image('standard.webp', 200, 200);

        $r1 = $this->withSession(['_token' => 'test-token'])->actingAs($admin)->post(route('admin.events.ticket-types.upsert', $event->id), [
            '_token' => 'test-token',
            'code' => 'VIP',
            'price' => 20,
            'stock' => 100,
            'external_purchase_url' => '',
            'is_active' => 1,
            'image' => $file1,
        ]);
        $r1->assertStatus(302);

        $r2 = $this->withSession(['_token' => 'test-token'])->actingAs($admin)->post(route('admin.events.ticket-types.upsert', $event->id), [
            '_token' => 'test-token',
            'code' => 'STANDARD',
            'price' => 10,
            'stock' => 50,
            'external_purchase_url' => '',
            'is_active' => 1,
            'image' => $file2,
        ]);
        $r2->assertStatus(302);

        $this->assertSame(2, \App\Models\EventTicketType::query()->where('event_id', $event->id)->count());
        $paths = \App\Models\EventTicketType::query()->where('event_id', $event->id)->pluck('image_path')->filter()->values();
        $this->assertSame(2, $paths->count());
        foreach ($paths as $p) {
            Storage::disk('public')->assertExists($p);
        }
    }

    public function test_admin_can_update_event_flyer_and_replace_it(): void
    {
        Storage::fake('public');

        $admin = new User();
        $admin->fill([
            'name' => 'Admin',
            'email' => 'admin5@example.com',
            'password' => 'password1234',
        ]);
        $admin->forceFill(['legacy_role' => 'super_admin', 'is_active' => true])->save();
        $admin->syncAppRole('super_admin');

        $event = new Event();
        $event->fill([
            'name' => ['es' => 'Evento Flyer'],
            'description' => ['es' => 'Desc'],
            'event_date' => now()->setTime(12, 0, 0),
            'start_at' => now()->setTime(10, 0, 0),
            'end_at' => now()->setTime(12, 0, 0),
            'address' => 'Addr',
            'location' => ['es' => 'Sitges, España'],
            'is_active' => true,
        ]);
        $event->save();

        $file1 = UploadedFile::fake()->image('flyer1.webp', 400, 400);
        $r1 = $this->withSession(['_token' => 'test-token'])->actingAs($admin)->post(route('admin.events.update', $event->id), [
            '_token' => 'test-token',
            '_method' => 'PATCH',
            'name' => 'Evento Flyer',
            'description' => 'Desc',
            'address' => 'Addr',
            'location' => 'Sitges, España',
            'google_maps_url' => '',
            'external_ticket_url' => '',
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '12:00',
            'is_active' => 1,
            'flyer' => $file1,
        ]);
        $r1->assertStatus(302);
        $event->refresh();
        $firstPath = $event->flyer_path;
        $this->assertNotNull($firstPath);
        Storage::disk('public')->assertExists($firstPath);

        $file2 = UploadedFile::fake()->image('flyer2.webp', 400, 400);
        $r2 = $this->withSession(['_token' => 'test-token'])->actingAs($admin)->post(route('admin.events.update', $event->id), [
            '_token' => 'test-token',
            '_method' => 'PATCH',
            'name' => 'Evento Flyer',
            'description' => 'Desc',
            'address' => 'Addr',
            'location' => 'Sitges, España',
            'google_maps_url' => '',
            'external_ticket_url' => '',
            'start_date' => now()->format('Y-m-d'),
            'end_date' => now()->format('Y-m-d'),
            'start_time' => '10:00',
            'end_time' => '12:00',
            'is_active' => 1,
            'flyer' => $file2,
        ]);
        $r2->assertStatus(302);
        $event->refresh();
        $this->assertNotNull($event->flyer_path);
        $this->assertNotSame($firstPath, $event->flyer_path);
        Storage::disk('public')->assertExists($event->flyer_path);
        Storage::disk('public')->assertMissing($firstPath);
    }
}
