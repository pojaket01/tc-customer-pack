import { Document } from "mongoose"

export interface IInvoice extends Document {
    invoiceNumber: string;
    customerName: string;
    amount: number;
    details: {
        description: string;
        quantity: number;
        quantityUnit: string;
        price: number;
        totalPrice: number;
    }[];
    dueDate: Date;
    status: 'paid' | 'unpaid' | 'overdue';
}