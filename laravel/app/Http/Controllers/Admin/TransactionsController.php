<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\Request;

class TransactionsController extends Controller
{
    public function destroy(Request $request, Transaction $transaction)
    {
        $role = (string) ($request->user()?->role ?? '');
        if (!in_array($role, ['admin', 'super_admin', 'super_user'], true)) {
            abort(403);
        }

        if (strtolower((string) $transaction->status) !== 'failed') {
            abort(422, 'Solo se pueden borrar transacciones failed.');
        }

        $hasItems = $transaction->items()->exists();
        if ($hasItems) {
            abort(422, 'No se puede borrar una transacción failed con items asociados.');
        }

        $transaction->delete();

        return back();
    }
}

