import { Document } from "mongoose";
export interface IReceipt extends Document {
    receiptNumber: string;
    receiptDate: Date;
    customerName: string;
    customerTaxId: string;
    customerAddress: string;
    sellerName: string;
    totalAmount: number;
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
    paymentMethod?: string;
    referenceNumber?: string;
}
//# sourceMappingURL=receipt.d.ts.map