import { NextResponse } from 'next/server';
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerOptions } from '@/lib/swagger/config';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get API documentation
 *     description: Returns OpenAPI/Swagger specification
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 */
export async function GET() {
  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  
  return NextResponse.json(swaggerSpec, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}