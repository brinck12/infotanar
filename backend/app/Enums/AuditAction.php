<?php

declare(strict_types=1);

namespace App\Enums;

enum AuditAction: string
{
    case AccountExported = 'account.exported';
    case AccountDeleted = 'account.deleted';

    case CatalogCreated = 'catalog.created';
    case CatalogUpdated = 'catalog.updated';
    case CatalogDeleted = 'catalog.deleted';
    case CatalogReordered = 'catalog.reordered';

    case AccessGranted = 'access.granted';
    case AccessRevoked = 'access.revoked';

    case SubscriptionCancelScheduled = 'subscription.cancel_scheduled';
    case SubscriptionResumed = 'subscription.resumed';

    case InvoiceBuyerCorrected = 'invoice.buyer_corrected';
    case InvoiceRetried = 'invoice.retried';
}
