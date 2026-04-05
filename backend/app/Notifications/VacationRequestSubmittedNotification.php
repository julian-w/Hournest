<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Vacation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VacationRequestSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Vacation $vacation
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $employeeName = $this->vacation->user?->display_name ?? 'Employee';
        $scopeLabel = $this->vacation->scope->value === 'full_day' ? 'Full day' : 'Half day';

        return (new MailMessage())
            ->subject('New vacation request')
            ->greeting('Hello!')
            ->line($employeeName . ' submitted a new vacation request.')
            ->line('Period: ' . $this->vacation->start_date->toDateString() . ' to ' . $this->vacation->end_date->toDateString())
            ->line('Scope: ' . $scopeLabel)
            ->when(
                filled($this->vacation->comment),
                fn (MailMessage $message) => $message->line('Comment: ' . $this->vacation->comment)
            )
            ->line('Please review the request in the admin area.');
    }
}
