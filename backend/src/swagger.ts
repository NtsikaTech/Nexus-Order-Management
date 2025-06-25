import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Nexus Order Management API',
    version: '1.0.0',
    description: 'API documentation for Nexus Order Management backend',
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Local server' },
  ],
};

const options = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJSDoc(options); 