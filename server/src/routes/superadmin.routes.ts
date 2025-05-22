import { Router } from 'express';
import * as OrganizationsController from '../controllers/superadmin/organizations.controller';
import PaymentWebhookController from '../controllers/admin/payment-webhook.controller';
import { hybridAuthenticate, requireSuperAdmin } from '../middleware/hybrid-auth.middleware';

const router = Router();
const paymentWebhookController = new PaymentWebhookController();

// Webhookエンドポイントは認証をバイパス
// Webhookは独自の認証メカニズム（署名検証）を使用するため
router.post('/webhook/univerpay', paymentWebhookController.handleWebhook);

// その他のスーパー管理者エンドポイントでは認証を要求
router.use(hybridAuthenticate, requireSuperAdmin);

// 組織管理API
router.get('/organizations', OrganizationsController.getOrganizations);
router.get('/organizations/:organizationId', OrganizationsController.getOrganizationDetail);
router.post('/organizations', OrganizationsController.createOrganization);
router.put('/organizations/:organizationId', OrganizationsController.updateOrganization);
router.put('/organizations/:organizationId/status', OrganizationsController.updateOrganizationStatus);
router.post('/organizations/:organizationId/extend-trial', OrganizationsController.extendOrganizationTrial);

// 組織オーナー管理API
router.get('/organizations/:organizationId/owner', OrganizationsController.getOrganizationOwner);
router.put('/organizations/:organizationId/owner', OrganizationsController.changeOrganizationOwner);

// 一括操作API
router.put('/batch/organizations/status', OrganizationsController.batchUpdateOrganizationStatus);
router.post('/batch/organizations/extend-trial', OrganizationsController.batchExtendOrganizationTrial);

export default router;