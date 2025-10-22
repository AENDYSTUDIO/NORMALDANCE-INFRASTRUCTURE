import { SolanaPayService } from '@/lib/solana-pay';
import { NextResponse } from 'next/server';
import { solanaWebhookPostSchema } from '@/lib/schemas';
import { handleApiError } from '@/lib/errors/errorHandler';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    
    const { signature, recipient, amount } = solanaWebhookPostSchema.parse(body);
    
    // Validate the payment using Solana Pay service
    const solanaPayService = new SolanaPayService(
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
      process.env.NEXT_PUBLIC_PLATFORM_WALLET || ''
    );
    
    const config = {
      recipient,
      amount: parseFloat(amount),
    };
    
    const isValid = await solanaPayService.validatePayment(signature, config);
    
    if (isValid) {
      // Payment is valid, update status in database (placeholder)
      // In a real implementation, you would update user's balance, mark order as paid, etc.
      
      // For now, just log the successful payment
      console.log(`Valid payment received: signature=${signature}, recipient=${recipient}, amount=${amount}`);
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Payment validated successfully' 
        },
        { status: 200 }
      );
    } else {
      // Payment validation failed
      console.log(`Invalid payment: signature=${signature}, recipient=${recipient}, amount=${amount}`);
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Payment validation failed' 
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return handleApiError(error);
  }
}