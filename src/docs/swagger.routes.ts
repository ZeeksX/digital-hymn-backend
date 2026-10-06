import { Router, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.spec';

const router = Router();

// Serve raw JSON spec
router.get('/docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Serve interactive Swagger UI
const uiOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'Digital Hymn Book API Documentation',
  customCss: `
    .swagger-ui .topbar { background-color: #0f172a; }
    .swagger-ui .topbar .download-url-wrapper { display: none; }
    .swagger-ui .info { margin: 24px 0; }
  `,
};

router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, uiOptions));

export default router;
