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
    paymentTermsAmount?: number;
    paymentTermsPercentage?: number;
    taxPercentage?: number;
    taxAmount?: number;
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