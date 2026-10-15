<?php

declare(strict_types=1);

namespace App\Enums;

enum AuditAction: string
{
    case AccountExported = 'account.exported';
    case AccountDeleted = 'account.deleted';
    case AccountPasswordChanged = 'account.password_changed';
    case AccountEmailChanged = 'account.email_changed';

    case CatalogCreated = 'catalog.created';
    case CatalogUpdated = 'catalog.updated';
    case CatalogDeleted = 'catalog.deleted';
    case CatalogReordered = 'catalog.reordered';

    // Feladathoz vagy vizsgahoz csatolt fajlok; az alany maga a csatolmany.
    case AttachmentUploaded = 'attachment.uploaded';
    case AttachmentDeleted = 'attachment.deleted';

    // A vizsga, a vizsgaresz es az ertekelesi pont szerkesztese a Catalog* eseteket hasznalja.
    case ExamPublished = 'exam.published';
    case ExamUnpublished = 'exam.unpublished';

    case AccessGranted = 'access.granted';
    case AccessRevoked = 'access.revoked';

    case SubscriptionCancelScheduled = 'subscription.cancel_scheduled';
    case SubscriptionResumed = 'subscription.resumed';

    case InvoiceBuyerCorrected = 'invoice.buyer_corrected';
    case InvoiceRetried = 'invoice.retried';
    case InvoiceDownloaded = 'invoice.downloaded';

    case UserRoleChanged = 'user.role_changed';
    case UserVerificationResent = 'user.verification_resent';
    case UserEmailVerified = 'user.email_verified';
    case UserTokensRevoked = 'user.tokens_revoked';
    case UserPasswordResetSent = 'user.password_reset_sent';

    // Zart beta regisztracios kapu (LAUNCH-2); a hasznalat alanya a meghivokod.
    case InviteCodeCreated = 'invite_code.created';
    case InviteCodeDisabled = 'invite_code.disabled';
    case InviteCodeUsed = 'invite_code.used';
    case RegistrationModeChanged = 'registration.mode_changed';
}
