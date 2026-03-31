import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: 'Virtual Classroom API',
            version: '1.0.0',
            description: 'API documentation for the Virtual Classroom Application',
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Access Token stored in memory/local storage',
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'refreshToken', 
                    description: 'Refresh Token stored as an HTTP-only cookie',
                },
            },
        },
    },
    apis: [ './src/routes/*.ts', './src/controllers/*.ts' ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
    console.log('📄 Swagger docs available at http://localhost:5000/api-docs');
};