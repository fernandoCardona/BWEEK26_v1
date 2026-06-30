<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Ticket;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UsersController extends Controller
{
    private function isFixedUser(User $user): bool
    {
        $emails = array_map(
            fn ($u) => strtolower(trim((string) ($u['email'] ?? ''))),
            (array) config('core_users.fixed_users', [])
        );
        $emails = array_values(array_filter($emails, fn ($e) => $e !== ''));
        return in_array(strtolower(trim((string) $user->email)), $emails, true);
    }

    public function index(Request $request)
    {
        $q = $request->string('q');

        $users = User::query()
            ->select(['id', 'name', 'last_name', 'email', 'phone', 'legacy_role', 'created_at'])
            ->addSelect(DB::raw('coalesce(is_active, true) as is_active'))
            ->when($q->isNotEmpty(), function ($query) use ($q) {
                $term = '%' . $q->toString() . '%';
                $query->where(function ($sub) use ($term) {
                    $sub->where('email', 'ilike', $term)
                        ->orWhere('phone', 'ilike', $term)
                        ->orWhere('name', 'ilike', $term)
                        ->orWhere('last_name', 'ilike', $term)
                        ->orWhereRaw("concat(name,' ',coalesce(last_name,'')) ilike ?", [$term]);
                });
            })
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (User $listedUser) => [
                'id' => $listedUser->id,
                'name' => $listedUser->name,
                'last_name' => $listedUser->last_name,
                'email' => $listedUser->email,
                'phone' => $listedUser->phone,
                'role' => $listedUser->roleName(),
                'is_active' => (bool) ($listedUser->is_active ?? true),
                'created_at' => optional($listedUser->created_at)->toISOString(),
            ]);

        return Inertia::render('Admin/Users/Index', [
            'filters' => [
                'q' => $q->toString(),
            ],
            'users' => $users,
            'selectedUser' => null,
            'selectedTickets' => [],
            'selectedStats' => null,
            'can' => [
                'update_role' => (bool) $request->user()?->canManageUserRoles(),
            ],
        ]);
    }

    public function show(Request $request, User $user)
    {
        $q = $request->string('q');

        $users = User::query()
            ->select(['id', 'name', 'last_name', 'email', 'phone', 'legacy_role', 'created_at'])
            ->addSelect(DB::raw('coalesce(is_active, true) as is_active'))
            ->when($q->isNotEmpty(), function ($query) use ($q) {
                $term = '%' . $q->toString() . '%';
                $query->where(function ($sub) use ($term) {
                    $sub->where('email', 'ilike', $term)
                        ->orWhere('phone', 'ilike', $term)
                        ->orWhere('name', 'ilike', $term)
                        ->orWhere('last_name', 'ilike', $term)
                        ->orWhereRaw("concat(name,' ',coalesce(last_name,'')) ilike ?", [$term]);
                });
            })
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (User $listedUser) => [
                'id' => $listedUser->id,
                'name' => $listedUser->name,
                'last_name' => $listedUser->last_name,
                'email' => $listedUser->email,
                'phone' => $listedUser->phone,
                'role' => $listedUser->roleName(),
                'is_active' => (bool) ($listedUser->is_active ?? true),
                'created_at' => optional($listedUser->created_at)->toISOString(),
            ]);

        $ticketsTotal = Ticket::query()->where('user_id', $user->id)->count();
        $ticketsActive = Ticket::query()->where('user_id', $user->id)->where('status', 'active')->count();
        $ticketsValidated = Ticket::query()->where('user_id', $user->id)->whereNotNull('validated_at')->count();

        $tickets = Ticket::query()
            ->with(['event:id,name,event_date'])
            ->where('user_id', $user->id)
            ->orderByDesc('purchased_at')
            ->limit(100)
            ->get()
            ->map(function (Ticket $ticket) {
                return [
                    'id' => $ticket->id,
                    'ticket_type' => $ticket->ticket_type,
                    'price' => (string) $ticket->price,
                    'status' => $ticket->status,
                    'qr_code' => $ticket->qr_code,
                    'purchased_at' => optional($ticket->purchased_at)->toISOString(),
                    'validated_at' => optional($ticket->validated_at)->toISOString(),
                    'event' => $ticket->event ? [
                        'id' => $ticket->event->id,
                        'name' => $ticket->event->name,
                        'event_date' => optional($ticket->event->event_date)->toISOString(),
                    ] : null,
                ];
            });

        $transactions = Transaction::query()
            ->with([
                'items.product:id,name,price',
                'items.ticket.event:id,name,event_date',
                'billingDocument',
            ])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function (Transaction $tx) {
                return [
                    'id' => $tx->id,
                    'type' => $tx->type,
                    'status' => $tx->status,
                    'currency' => $tx->currency,
                    'total_amount' => (string) $tx->total_amount,
                    'created_at' => optional($tx->created_at)->toISOString(),
                    'billing_document' => $tx->billingDocument ? [
                        'id' => $tx->billingDocument->id,
                        'kind' => $tx->billingDocument->kind,
                        'series' => $tx->billingDocument->series,
                        'year' => (int) $tx->billingDocument->year,
                        'sequence' => (int) $tx->billingDocument->sequence,
                        'number' => $tx->billingDocument->number,
                        'issued_at' => optional($tx->billingDocument->issued_at)->toISOString(),
                        'currency' => $tx->billingDocument->currency,
                        'vat_rate' => (string) $tx->billingDocument->vat_rate,
                        'subtotal_amount' => (string) $tx->billingDocument->subtotal_amount,
                        'vat_amount' => (string) $tx->billingDocument->vat_amount,
                        'total_amount' => (string) $tx->billingDocument->total_amount,
                        'issuer' => $tx->billingDocument->issuer,
                        'recipient' => $tx->billingDocument->recipient,
                        'lines' => $tx->billingDocument->lines,
                    ] : null,
                    'items' => $tx->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'kind' => $item->kind,
                            'title' => $item->title ?: ($item->product ? ($item->product->getTranslation('name', app()->getLocale()) ?? '') : null),
                            'quantity' => (int) $item->quantity,
                            'unit_price' => (string) $item->unit_price,
                            'total_price' => (string) $item->total_price,
                            'ticket' => $item->ticket ? [
                                'id' => $item->ticket->id,
                                'ticket_type' => $item->ticket->ticket_type,
                                'status' => $item->ticket->status,
                                'event' => $item->ticket->event ? [
                                    'id' => $item->ticket->event->id,
                                    'name' => $item->ticket->event->name,
                                    'event_date' => optional($item->ticket->event->event_date)->toISOString(),
                                ] : null,
                            ] : null,
                            'product' => $item->product ? [
                                'id' => $item->product->id,
                                'name' => $item->product->name,
                                'price' => (string) $item->product->price,
                            ] : null,
                        ];
                    }),
                ];
            });

        $cart = Cart::query()
            ->firstOrCreate(['user_id' => $user->id], ['currency' => 'EUR'])
            ->load(['items.product:id,name,price']);

        $cartPayload = [
            'id' => $cart->id,
            'currency' => $cart->currency,
            'items' => $cart->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'quantity' => (int) $item->quantity,
                    'unit_price' => (string) $item->unit_price,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'price' => (string) $item->product->price,
                    ] : null,
                ];
            }),
        ];

        return Inertia::render('Admin/Users/Index', [
            'filters' => [
                'q' => $q->toString(),
            ],
            'users' => $users,
            'selectedUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'last_name' => $user->last_name,
                'nickname' => $user->nickname,
                'avatar_url' => $user->avatar_url,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->roleName(),
                'is_active' => (bool) ($user->is_active ?? true),
                'birth_date' => optional($user->birth_date)->format('Y-m-d'),
                'gender' => $user->gender,
                'address_line1' => $user->address_line1,
                'address_line2' => $user->address_line2,
                'city' => $user->city,
                'postal_code' => $user->postal_code,
                'country' => $user->country,
                'newsletter_subscribed' => (bool) $user->newsletter_subscribed,
                'email_verified_at' => optional($user->email_verified_at)->toISOString(),
                'created_at' => optional($user->created_at)->toISOString(),
            ],
            'selectedTickets' => $tickets,
            'selectedTransactions' => $transactions,
            'selectedCart' => $cartPayload,
            'selectedStats' => [
                'tickets_total' => $ticketsTotal,
                'tickets_active' => $ticketsActive,
                'tickets_validated' => $ticketsValidated,
                'merch_purchases_total' => 0,
            ],
            'can' => [
                'update_role' => (bool) $request->user()?->canManageUserRoles(),
            ],
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'nickname' => ['nullable', 'string', 'max:80'],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female,other,prefer_not_say'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:30'],
            'country' => ['nullable', 'string', 'max:120'],
            'no_newsletter' => ['nullable', 'boolean'],
            'avatar' => ['nullable', 'image', 'max:2048'],
            'remove_avatar' => ['nullable', 'boolean'],
        ]);

        if ($this->isFixedUser($user) && strtolower(trim((string) $data['email'])) !== strtolower(trim((string) $user->email))) {
            return back()->withErrors([
                'email' => 'Este usuario es fijo y su email no se puede cambiar.',
            ]);
        }

        $emailChanged = $data['email'] !== $user->email;

        $user->fill([
            'name' => $data['name'],
            'last_name' => $data['last_name'] ?? null,
            'nickname' => $data['nickname'] ?? null,
            'birth_date' => ($data['birth_date'] ?? null) ?: null,
            'gender' => $data['gender'] ?? null,
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'address_line1' => $data['address_line1'] ?? null,
            'address_line2' => $data['address_line2'] ?? null,
            'city' => $data['city'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'country' => trim((string) ($data['country'] ?? '')) ?: null,
            'newsletter_subscribed' => !((bool) ($data['no_newsletter'] ?? false)),
        ]);

        if ((bool) ($data['remove_avatar'] ?? false) && !$request->hasFile('avatar')) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }
            $user->avatar_path = null;
        }

        if ($request->hasFile('avatar')) {
            if ($user->avatar_path) {
                Storage::disk('public')->delete($user->avatar_path);
            }
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->avatar_path = $path;
        }

        if ($emailChanged) {
            $user->email_verified_at = null;
        }

        $user->save();

        return back();
    }

    public function sendPasswordReset(Request $request, User $user)
    {
        Password::sendResetLink(['email' => $user->email]);
        return back();
    }

    public function store(Request $request)
    {
        $authUser = $request->user();
        if (!$authUser || !$authUser->canManageUserRoles()) {
            abort(403);
        }

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'nickname' => ['nullable', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:50'],
            'role' => ['required', 'string', 'in:user,admin,super_admin'],
        ]);

        $tempPassword = Str::random(32);

        $user = new User();
        $user->fill([
            'name' => $data['name'],
            'last_name' => $data['last_name'] ?? null,
            'nickname' => $data['nickname'] ?? null,
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($tempPassword),
            'email_verified_at' => now(),
        ]);
        $user->legacy_role = User::normalizeRoleName($data['role'] ?? 'user');
        $user->is_active = true;
        $user->save();
        $user->syncAppRole($data['role'] ?? 'user');

        Password::sendResetLink(['email' => $user->email]);

        return redirect()->route('admin.users.show', $user->id);
    }

    public function toggleActive(Request $request, User $user)
    {
        $authUser = $request->user();
        if (!$authUser) {
            abort(403);
        }
        if ($this->isFixedUser($user)) {
            return back()->withErrors([
                'user' => 'Este usuario es fijo y no se puede desactivar.',
            ]);
        }
        if ($authUser->id === $user->id) {
            return back()->withErrors([
                'user' => 'No puedes deshabilitar tu propia cuenta.',
            ]);
        }

        $allowed = false;
        if (!$authUser->canManageUsers()) {
            abort(403);
        }

        if ($authUser->isSuperAdmin()) {
            $allowed = $user->hasAnyAppRole(['user', 'admin']);
        } elseif ($authUser->hasAppRole('admin')) {
            $allowed = $user->hasAppRole('user');
        }
        if (!$allowed) {
            abort(403);
        }

        $user->forceFill([
            'is_active' => !$user->is_active,
        ])->save();

        return back();
    }

    public function destroy(Request $request, User $user)
    {
        $authUser = $request->user();
        if (!$authUser) {
            abort(403);
        }
        if ($this->isFixedUser($user)) {
            return back()->withErrors([
                'user' => 'Este usuario es fijo y no se puede eliminar.',
            ]);
        }
        if ($authUser->id === $user->id) {
            return back()->withErrors([
                'user' => 'No puedes eliminar tu propia cuenta desde aquí.',
            ]);
        }

        $allowed = false;
        if (!$authUser->canManageUsers()) {
            abort(403);
        }

        if ($authUser->isSuperAdmin()) {
            $allowed = $user->hasAnyAppRole(['user', 'admin']);
        } elseif ($authUser->hasAppRole('admin')) {
            $allowed = $user->hasAppRole('user');
        }
        if (!$allowed) {
            abort(403);
        }

        if ($user->avatar_path) {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->delete();

        return redirect()->route('admin.users.index');
    }

    public function updateTicket(Request $request, User $user, Ticket $ticket)
    {
        if ($ticket->user_id !== $user->id) {
            abort(404);
        }

        $data = $request->validate([
            'status' => ['required', 'string', 'in:active,cancelled,refunded'],
        ]);

        $ticket->update([
            'status' => $data['status'],
        ]);

        return back();
    }

    public function destroyTicket(Request $request, User $user, Ticket $ticket)
    {
        if ($ticket->user_id !== $user->id) {
            abort(404);
        }

        $ticket->delete();

        return back();
    }

    public function updateRole(Request $request, User $user)
    {
        $request->validate([
            'role' => ['required', 'string', 'in:user,admin,super_admin'],
        ]);

        if ($this->isFixedUser($user)) {
            return back()->withErrors([
                'role' => 'Este usuario es fijo y su rol no se puede cambiar.',
            ]);
        }

        $authUser = $request->user();
        if (!$authUser || !$authUser->canManageUserRoles()) {
            abort(403);
        }
        if ($authUser && $authUser->id === $user->id) {
            return back()->withErrors([
                'role' => 'No puedes cambiar tu propio rol.',
            ]);
        }

        $user->forceFill([
            'legacy_role' => User::normalizeRoleName($request->string('role')->toString()),
        ])->save();
        $user->syncAppRole($request->string('role')->toString());

        return back();
    }
}
