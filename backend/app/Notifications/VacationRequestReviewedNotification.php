<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Vacation;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class VacationRequestReviewedNotification extends Notification
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
        $statusLabel = ucfirst($this->vacation->status->value);
        $reviewerName = $this->vacation->reviewer?->display_name ?? 'Admin';

        return (new MailMessage())
            ->subject('Vacation request ' . strtolower($statusLabel))
            ->greeting('Hello ' . ($this->vacation->user?->display_name ?? '') . '!')
            ->line('Your vacation request was reviewed.')
            ->line('Status: ' . $statusLabel)
            ->line('Period: ' . $this->vacation->start_date->toDateString() . ' to ' . $this->vacation->end_date->toDateString())
            ->line('Reviewed by: ' . $reviewerName)
            ->when(
                filled($this->vacation->comment),
                fn (MailMessage $message) => $message->line('Comment: ' . $this->vacation->comment)
            );
    }
}
