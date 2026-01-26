<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable)
    {
        $url = $this->resetUrl($notifiable);

        return (new MailMessage)
            ->subject('Cambia tu contraseña • Bears Sitges Week')
            ->greeting('Hola ' . ($notifiable->nickname ?: $notifiable->name) . '!')
            ->line('Hemos recibido una solicitud para cambiar tu contraseña.')
            ->action('Cambiar contraseña', $url)
            ->line('Si no has solicitado este cambio, puedes ignorar este email.')
            ->salutation('Equipo Bears Sitges Week');
    }
}

