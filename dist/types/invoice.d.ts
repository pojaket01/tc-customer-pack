import { Document } from "mongoose";
export interface IInvoice extends Document {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    customerName: string;
    customerTaxId: string;
    customerAddress: string;
    sellerName: string;
    projectName?: string;
    discount?: number;
    totalAmount: number;
    isPaymentTerm: boolean;
    paymentTermDetails?: {
        percentage: number;
    }[];
    taxPercentage?: number;
    taxAmount?: number;
    withholderTaxPercentage?: number;
    withholderTaxAmount?: number;
    amountDue: number;
    details: {
        description: string;
        quantity: number;
        quantityUnit: string;
        price: number;
        totalPrice: number;
    }[];
    remarks?: string;
    status: 'paid' | 'unpaid' | 'overdue';
}
//# sourceMappingURL=invoice.d.ts.map