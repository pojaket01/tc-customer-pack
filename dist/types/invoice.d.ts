import { Document } from "mongoose";
export interface IInvoice extends Document {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    customerName: string;
    sellerName: string;
    reference?: string;
    projectName?: string;
    price: number;
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
    status: 'paid' | 'unpaid' | 'overdue';
}
//# sourceMappingURL=invoice.d.ts.map