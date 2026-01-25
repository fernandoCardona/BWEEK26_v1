<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UsersController extends Controller
{
    public function index(Request $request)
    {
        $q = $request->string('q');

        $users = User::query()
            ->select(['id', 'name', 'last_name', 'email', 'phone', 'role', 'created_at'])
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
            ->withQueryString();

        return Inertia::render('Admin/Users/Index', [
            'filters' => [
                'q' => $q->toString(),
            ],
            'users' => $users,
            'selectedUser' => null,
            'selectedTickets' => [],
            'selectedStats' => null,
            'can' => [
                'update_role' => $request->user()?->role === 'super_admin',
            ],
        ]);
    }

    public function show(Request $request, User $user)
    {
        $q = $request->string('q');

        $users = User::query()
            ->select(['id', 'name', 'last_name', 'email', 'phone', 'role', 'created_at'])
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
            ->withQueryString();

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

        return Inertia::render('Admin/Users/Index', [
            'filters' => [
                'q' => $q->toString(),
            ],
            'users' => $users,
            'selectedUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
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
            'selectedStats' => [
                'tickets_total' => $ticketsTotal,
                'tickets_active' => $ticketsActive,
                'tickets_validated' => $ticketsValidated,
                'merch_purchases_total' => 0,
            ],
            'can' => [
                'update_role' => $request->user()?->role === 'super_admin',
            ],
        ]);
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'gender' => ['nullable', 'string', 'in:male,female,other,prefer_not_say'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'address_line1' => ['nullable', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:30'],
            'country' => ['nullable', 'string', 'max:2'],
            'no_newsletter' => ['nullable', 'boolean'],
        ]);

        $emailChanged = $data['email'] !== $user->email;

        $user->fill([
            'name' => $data['name'],
            'last_name' => $data['last_name'] ?? null,
            'birth_date' => $data['birth_date'] ?? null,
            'gender' => $data['gender'] ?? null,
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'address_line1' => $data['address_line1'] ?? null,
            'address_line2' => $data['address_line2'] ?? null,
            'city' => $data['city'] ?? null,
            'postal_code' => $data['postal_code'] ?? null,
            'country' => strtoupper($data['country'] ?? '') ?: null,
            'newsletter_subscribed' => !((bool) ($data['no_newsletter'] ?? false)),
        ]);

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

        $authUser = $request->user();
        if ($authUser && $authUser->id === $user->id) {
            return back()->withErrors([
                'role' => 'No puedes cambiar tu propio rol.',
            ]);
        }

        $user->update([
            'role' => $request->string('role')->toString(),
        ]);

        return back();
    }
}
