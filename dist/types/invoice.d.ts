import { Document } from "mongoose";
export interface IInvoice extends Document {
    invoiceNumber: string;
    invoiceDate: Date;
    customerName: string;
    customerTaxId: string;
    customerAddress: string;
    sellerName: string;
    totalAmount: number;
    isPaymentTerm: boolean;
    paymentTermDetails?: {
        percentage: number;
    }[];
    taxAmount?: number;
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
}
//# sourceMappingURL=invoice.d.ts.map