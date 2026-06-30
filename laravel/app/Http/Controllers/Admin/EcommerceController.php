<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventTicketType;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\TicketTemplate;
use App\Models\Ticket;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class EcommerceController extends Controller
{
    public function index(Request $request)
    {
        $ticketEventId = trim((string) $request->query('ticket_event_id', ''));
        $ticketSort = trim((string) $request->query('ticket_sort', 'date_desc'));

        $ticketTypesQuery = EventTicketType::query()
            ->with([
                'ticketTemplate:id,name,code',
                'event:id,parent_event_id,name,is_active,end_at',
                'event.parent:id,name',
            ])
            ->limit(500);

        if ($ticketEventId !== '') {
            $ticketTypesQuery->where('event_id', $ticketEventId);
        }

        $ticketTypes = $ticketTypesQuery->get();
        $ticketTypeIds = $ticketTypes->pluck('id')->filter()->values()->all();
        $soldByType = [];
        if (!empty($ticketTypeIds)) {
            $soldRows = Ticket::query()
                ->select('event_ticket_type_id', DB::raw('count(*)::int as sold_count'), DB::raw('coalesce(sum(price),0) as sold_amount'))
                ->whereIn('event_ticket_type_id', $ticketTypeIds)
                ->whereNotNull('transaction_id')
                ->groupBy('event_ticket_type_id')
                ->get();
            foreach ($soldRows as $r) {
                $soldByType[(string) $r->event_ticket_type_id] = [
                    'sold_count' => (int) ($r->sold_count ?? 0),
                    'sold_amount' => (string) ($r->sold_amount ?? 0),
                ];
            }
        }

        $ticketTypesPayload = $ticketTypes
            ->map(function (EventTicketType $t) use ($soldByType) {
                $event = $t->event;
                $parent = $event?->parent;
                $eventName = $event?->name;
                $parentName = $parent?->name;
                $eventEnd = $event?->end_at ? $event->end_at->format('Y-m-d\\TH:i:s') : null;
                $sold = $soldByType[(string) $t->id] ?? ['sold_count' => 0, 'sold_amount' => '0'];

                return [
                    'id' => $t->id,
                    'name' => $t->ticketTemplate?->name,
                    'code' => $t->code,
                    'price' => (string) $t->price,
                    'stock' => (int) $t->stock,
                    'is_active' => (bool) $t->is_active,
                    'sold_count' => (int) ($sold['sold_count'] ?? 0),
                    'sold_amount' => (string) ($sold['sold_amount'] ?? '0'),
                    'event' => $event
                        ? [
                            'id' => $event->id,
                            'parent_event_id' => $event->parent_event_id,
                            'name' => $eventName,
                            'parent_name' => $parentName,
                            'is_active' => (bool) $event->is_active,
                            'end_at' => $eventEnd,
                        ]
                        : null,
                ];
            })
            ->values();

        if ($ticketSort === 'sold_desc') {
            $ticketTypesPayload = $ticketTypesPayload->sortByDesc('sold_count')->values();
        } elseif ($ticketSort === 'stock_asc') {
            $ticketTypesPayload = $ticketTypesPayload->sortBy('stock')->values();
        } elseif ($ticketSort === 'stock_desc') {
            $ticketTypesPayload = $ticketTypesPayload->sortByDesc('stock')->values();
        } else {
            $ticketTypesPayload = $ticketTypesPayload->sortByDesc('id')->values();
        }

        $eventsForTickets = Event::query()
            ->where('is_active', true)
            ->with(['parent:id,name'])
            ->orderByDesc('start_at')
            ->limit(800)
            ->get(['id', 'parent_event_id', 'name', 'start_at', 'end_at', 'is_active'])
            ->map(function (Event $e) {
                return [
                    'id' => $e->id,
                    'parent_event_id' => $e->parent_event_id,
                    'name' => $e->name,
                    'parent_name' => $e->parent?->name,
                    'end_at' => $e->end_at?->format('Y-m-d\\TH:i:s'),
                ];
            })
            ->values();

        $products = Product::query()
            ->where('is_active', true)
            ->withCount('variants')
            ->get();

        $ticketSummary = [
            'sold_count' => (int) TransactionItem::query()->where('kind', 'ticket')->sum('quantity'),
            'sold_amount' => (string) (TransactionItem::query()->where('kind', 'ticket')->sum('total_price') ?? 0),
        ];

        $productSummary = [
            'sold_count' => (int) TransactionItem::query()->where('kind', 'product')->sum('quantity'),
            'sold_amount' => (string) (TransactionItem::query()->where('kind', 'product')->sum('total_price') ?? 0),
        ];

        $transactionQuery = trim((string) $request->query('q', ''));
        $from = trim((string) $request->query('from', ''));
        $to = trim((string) $request->query('to', ''));
        $transactions = $this->searchTransactions($transactionQuery, $from, $to);

        return Inertia::render('Admin/Ecommerce/Index', [
            'ticketTypes' => $ticketTypesPayload,
            'eventsForTickets' => $eventsForTickets,
            'ticketSummary' => $ticketSummary,
            'productSummary' => $productSummary,
            'products' => $products,
            'categories' => ProductCategory::query()->orderBy('name')->get(['id', 'name', 'slug', 'is_active']),
            'transactions' => $transactions,
            'transactionQuery' => $transactionQuery,
            'transactionFrom' => $from,
            'transactionTo' => $to,
            'ticketEventId' => $ticketEventId,
            'ticketSort' => $ticketSort,
            'can' => [
                'manage' => $this->canManage($request),
                'delete' => $this->canDelete($request),
            ],
        ]);
    }

    public function warehouse()
    {
        $products = \App\Models\Product::query()
            ->with(['variants'])
            ->orderBy('name->es')
            ->get();
        return Inertia::render('Admin/Ecommerce/Warehouse', [
            'products' => $products,
        ]);
    }

    public function updateTicketType(\Illuminate\Http\Request $request, \App\Models\EventTicketType $ticketType)
    {
        $data = $request->validate([
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);

        $event = Event::query()->where('id', $ticketType->event_id)->first();
        $isExpired = $event && $event->end_at && $event->end_at->lt(now());
        $stock = (int) $data['stock'];
        $canBeActive = !$isExpired && $stock > 0 && (bool) ($event?->is_active ?? true);

        $ticketType->update([
            'price' => $data['price'],
            'stock' => $stock,
            'is_active' => $canBeActive ? (bool) $data['is_active'] : false,
        ]);

        return response()->json(['status' => 'ok']);
    }

    public function storeTicket(Request $request)
    {
        $this->authorizeManage($request);
        if (!Schema::hasTable('ticket_templates')) {
            if (app()->environment('local') && ($request->user()?->canManageUserRoles() ?? false)) {
                try {
                    Artisan::call('migrate', ['--force' => true]);
                } catch (\Throwable $e) {
                }
                if (!Schema::hasTable('ticket_templates')) {
                    try {
                        $this->ensureTicketTemplatesSchema();
                    } catch (\Throwable $e) {
                    }
                }
            }
            if (!Schema::hasTable('ticket_templates')) {
                throw ValidationException::withMessages([
                    'event_id' => 'Ejecuta las migraciones antes de crear tickets.',
                ]);
            }
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'event_id' => ['required', 'string', 'exists:events,id'],
            'description' => ['nullable', 'string', 'max:8000'],
            'legal_terms' => ['nullable', 'string', 'max:8000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $code = $this->generateUniqueTicketCode((string) $data['name']);

        $event = Event::query()->findOrFail($data['event_id']);
        $isExpired = $event->end_at && $event->end_at->lt(now());

        $stock = (int) $data['stock'];
        $isActive = !$isExpired && $stock > 0 ? (bool) ($data['is_active'] ?? true) : false;

        $tpl = new TicketTemplate();
        $tpl->fill([
            'name' => trim((string) $data['name']),
            'code' => $code,
            'price' => $data['price'],
            'stock' => $stock,
            'description' => $data['description'] ?? null,
            'legal_terms' => $data['legal_terms'] ?? null,
            'is_active' => $isActive,
        ]);
        $tpl->save();

        if ($request->hasFile('image')) {
            $tpl->image_path = $request->file('image')->store('ticket-templates/' . $tpl->id, 'public');
            $tpl->save();
        }

        $type = EventTicketType::query()->updateOrCreate(
            [
                'event_id' => $event->id,
                'code' => $tpl->code,
            ],
            [
                'ticket_template_id' => $tpl->id,
                'price' => $tpl->price,
                'stock' => $stock,
                'description' => $tpl->description,
                'legal_terms' => $tpl->legal_terms,
                'is_active' => $isActive,
            ]
        );

        if ($tpl->image_path) {
            $this->copyTicketTemplateImageToEvent($tpl, $event, $type);
        }

        return back();
    }

    public function updateTicketTemplate(Request $request, TicketTemplate $ticketTemplate)
    {
        $this->authorizeManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'code' => ['required', 'string', 'max:40', 'regex:/^[A-Za-z0-9][A-Za-z0-9 _-]*$/'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'external_purchase_url' => ['nullable', 'string', 'max:2048'],
            'description' => ['nullable', 'string', 'max:8000'],
            'legal_terms' => ['nullable', 'string', 'max:8000'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'remove_image' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $code = $this->normalizeTicketCode($data['code']);
        $exists = TicketTemplate::query()
            ->where('code', $code)
            ->where('id', '!=', $ticketTemplate->id)
            ->exists();
        if ($exists) {
            throw ValidationException::withMessages(['code' => 'Este código ya existe.']);
        }

        $stock = (int) $data['stock'];
        $isActive = $stock > 0 ? (bool) ($data['is_active'] ?? true) : false;

        $ticketTemplate->fill([
            'name' => trim((string) $data['name']),
            'code' => $code,
            'price' => $data['price'],
            'stock' => $stock,
            'external_purchase_url' => $data['external_purchase_url'] ?? null,
            'description' => $data['description'] ?? null,
            'legal_terms' => $data['legal_terms'] ?? null,
            'is_active' => $isActive,
        ])->save();

        if ((bool) ($data['remove_image'] ?? false)) {
            if ($ticketTemplate->image_path) {
                Storage::disk('public')->delete($ticketTemplate->image_path);
            }
            $ticketTemplate->image_path = null;
            $ticketTemplate->save();
        }

        if ($request->hasFile('image')) {
            if ($ticketTemplate->image_path) {
                Storage::disk('public')->delete($ticketTemplate->image_path);
            }
            $ticketTemplate->image_path = $request->file('image')->store('ticket-templates/' . $ticketTemplate->id, 'public');
            $ticketTemplate->save();
        }

        return back();
    }

    public function destroyTicketTemplate(Request $request, TicketTemplate $ticketTemplate)
    {
        $this->authorizeDelete($request);
        if ($ticketTemplate->image_path) {
            Storage::disk('public')->delete($ticketTemplate->image_path);
        }
        $ticketTemplate->delete();
        return back();
    }

    private function searchTransactions(string $query, string $from, string $to): array
    {
        $q = trim($query);
        $builder = Transaction::query()
            ->with(['user:id,name,email'])
            ->withCount('items')
            ->orderByDesc('created_at')
            ->limit(50);

        if ($from !== '') {
            try {
                $fromDate = Carbon::createFromFormat('Y-m-d', $from)->startOfDay();
                $builder->where('created_at', '>=', $fromDate);
            } catch (\Throwable $e) {
            }
        }
        if ($to !== '') {
            try {
                $toDate = Carbon::createFromFormat('Y-m-d', $to)->endOfDay();
                $builder->where('created_at', '<=', $toDate);
            } catch (\Throwable $e) {
            }
        }

        if ($q !== '') {
            $builder->where(function ($tx) use ($q) {
                $tx->where('id', 'ilike', '%' . $q . '%')
                    ->orWhereHas('user', function ($u) use ($q) {
                        $u->where('name', 'ilike', '%' . $q . '%')
                            ->orWhere('email', 'ilike', '%' . $q . '%');
                    });
            });
        }

        return $builder->get()->map(fn (Transaction $t) => [
            'id' => $t->id,
            'type' => $t->type,
            'status' => $t->status,
            'currency' => $t->currency,
            'total_amount' => (string) $t->total_amount,
            'items_count' => (int) ($t->items_count ?? 0),
            'user' => $t->user ? ['id' => $t->user->id, 'name' => $t->user->name, 'email' => $t->user->email] : null,
            'created_at' => $t->created_at?->toISOString(),
        ])->values()->all();
    }

    private function normalizeTicketCode(string $code): string
    {
        return strtoupper(str_replace(' ', '_', trim($code)));
    }

    private function generateUniqueTicketCode(string $name): string
    {
        $base = strtoupper((string) Str::slug(trim($name), '_'));
        $base = $base !== '' ? $base : 'TICKET';
        $base = substr($base, 0, 32);

        $code = $base;
        while (TicketTemplate::query()->where('code', $code)->exists()) {
            $suffix = strtoupper(substr(str_replace('-', '', (string) Str::uuid()), 0, 6));
            $code = substr($base, 0, 32) . '_' . $suffix;
            $code = substr($code, 0, 40);
        }

        return $code;
    }

    private function ensureTicketTemplatesSchema(): void
    {
        if (!Schema::hasTable('ticket_templates')) {
            Schema::create('ticket_templates', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('name', 120);
                $table->string('code', 40)->unique();
                $table->decimal('price', 10, 2)->default(0);
                $table->integer('stock')->default(0);
                $table->string('external_purchase_url', 2048)->nullable();
                $table->string('image_path')->nullable();
                $table->text('description')->nullable();
                $table->text('legal_terms')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        } else {
            if (!Schema::hasColumn('ticket_templates', 'name')) {
                Schema::table('ticket_templates', function (Blueprint $table) {
                    $table->string('name', 120)->nullable();
                });
            }
            if (!Schema::hasColumn('ticket_templates', 'is_active')) {
                Schema::table('ticket_templates', function (Blueprint $table) {
                    $table->boolean('is_active')->default(true);
                });
            }
        }

        if (Schema::hasTable('event_ticket_types') && !Schema::hasColumn('event_ticket_types', 'ticket_template_id')) {
            Schema::table('event_ticket_types', function (Blueprint $table) {
                $table->foreignUuid('ticket_template_id')->nullable()->constrained('ticket_templates')->nullOnDelete();
            });
        }
    }

    private function copyTicketTemplateImageToEvent(TicketTemplate $tpl, Event $event, EventTicketType $ticketType): void
    {
        $this->ensureMediaFolder($event);

        $ext = pathinfo((string) $tpl->image_path, PATHINFO_EXTENSION);
        $ext = $ext ? '.' . $ext : '';
        $dest = $event->media_folder . '/tickets/' . Str::uuid() . $ext;

        if ($ticketType->image_path) {
            Storage::disk('public')->delete($ticketType->image_path);
        }

        try {
            Storage::disk('public')->makeDirectory($event->media_folder . '/tickets');
            Storage::disk('public')->copy($tpl->image_path, $dest);
            $ticketType->image_path = $dest;
            $ticketType->save();
        } catch (\Throwable $e) {
        }
    }

    private function ensureMediaFolder(Event $event): void
    {
        if ($event->media_folder) {
            Storage::disk('public')->makeDirectory($event->media_folder);
            Storage::disk('public')->makeDirectory($event->media_folder . '/subevents');
            return;
        }

        $locale = app()->getLocale();
        $name = (string) ($event->name[$locale] ?? ($event->name['es'] ?? ($event->name['en'] ?? $event->id)));
        $shortId = substr((string) $event->id, 0, 8);
        $folderName = Str::slug($name) . '-' . $shortId;

        if ($event->parent_event_id) {
            $parent = Event::query()->find($event->parent_event_id);
            if ($parent) {
                if (!$parent->media_folder) {
                    $this->ensureMediaFolder($parent);
                }
                $event->media_folder = $parent->media_folder . '/subevents/' . $folderName;
            } else {
                $event->media_folder = 'images/events/' . $folderName;
            }
        } else {
            $event->media_folder = 'images/events/' . $folderName;
        }

        $event->save();

        Storage::disk('public')->makeDirectory($event->media_folder);
        Storage::disk('public')->makeDirectory($event->media_folder . '/subevents');
    }

    private function authorizeManage(Request $request): void
    {
        if (!$this->canManage($request)) {
            abort(403);
        }
    }

    private function authorizeDelete(Request $request): void
    {
        if (!$this->canDelete($request)) {
            abort(403);
        }
    }

    private function canManage(Request $request): bool
    {
        return (bool) $request->user()?->canManageEcommerce();
    }

    private function canDelete(Request $request): bool
    {
        return (bool) $request->user()?->isSuperAdmin();
    }
}
