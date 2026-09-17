import express from 'express';
import { getInvoices, getInvoiceById, createInvoice, updateInvoiceStatus, deleteInvoice } from '../controllers/invoiceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getInvoices);
router.get('/:id', getInvoiceById);
router.post('/', createInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

export default router;
