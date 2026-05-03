'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required.'),
  quantity: z.coerce.number().min(0.1, 'Quantity must be at least 0.1.'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative.'),
});

const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required.'),
  issueDate: z.string(),
  dueDate: z.string(),
  status: z.enum(['Paid', 'Unpaid', 'Partially Paid', 'Draft']),
  items: z.string(), // a stringified JSON
});

export async function createInvoice(formData: FormData) {
  const rawFormData = {
    customerId: formData.get('customerId'),
    issueDate: formData.get('issueDate'),
    dueDate: formData.get('dueDate'),
    status: formData.get('status'),
    items: formData.get('items'),
  };
  
  const validatedFields = createInvoiceSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: 'Invalid input. Please check the form fields.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const items = JSON.parse(validatedFields.data.items as string);
  const itemsValidation = z.array(invoiceItemSchema).min(1, 'At least one item is required.').safeParse(items);

  if(!itemsValidation.success) {
      return {
          error: 'Invalid items.',
          fieldErrors: {
              items: itemsValidation.error.flatten().formErrors,
          },
      }
  }

  // Here you would typically save the data to your database.
  // For now, we'll just log it to see that it works.
  console.log('New Invoice Data:', {
    ...validatedFields.data,
    items: itemsValidation.data,
  });

  // Since data is not persistent, revalidating path won't show new data.
  // In a real app, this would refresh the list on the invoices page.
  revalidatePath('/invoices');

  return {
    data: { message: 'Invoice created successfully!' },
  };
}
