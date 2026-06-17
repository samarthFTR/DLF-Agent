# Environment Variables

The system starts with local storage and Gemini as the default LLM. `.env.example` contains concrete variable names.

## Runtime

- `NODE_ENV`: Runtime environment.
- `PORT`: Express server port.
- `API_BASE_URL`: Public backend URL.
- `FRONTEND_URL`: Frontend URL for CORS and OAuth redirects.

## Database

- `DATABASE_URL`: PostgreSQL connection string consumed by Prisma.

## Auth and Security

- `JWT_ACCESS_SECRET`: Access-token signing secret.
- `JWT_REFRESH_SECRET`: Refresh-token signing secret.
- `JWT_ACCESS_TTL`: Access-token lifetime.
- `JWT_REFRESH_TTL`: Refresh-token lifetime.
- `TOKEN_ENCRYPTION_KEY`: Key used to encrypt OAuth tokens.

## Storage

- `STORAGE_PROVIDER`: `local` initially.
- `LOCAL_STORAGE_ROOT`: Root folder for local files.
- `PUBLIC_ASSET_BASE_URL`: URL prefix used to serve uploaded and generated assets.

## LLM and Image Generation

- `LLM_DEFAULT_PROVIDER`: `gemini`.
- `GEMINI_API_KEY`: Gemini API key.
- `GEMINI_TEXT_MODEL`: Default Gemini text model.
- `GEMINI_VISION_MODEL`: Default Gemini vision model.
- `IMAGE_GENERATION_PROVIDER`: Provider used for AI creative generation.

## Automation and Queueing

- `REDIS_URL`: Queue backend connection.
- `QUEUE_PREFIX`: Queue namespace.
- `N8N_BASE_URL`: n8n instance URL.
- `N8N_WEBHOOK_SECRET`: Secret for n8n-to-API calls.

## Social APIs

- `INSTAGRAM_CLIENT_ID`, `INSTAGRAM_CLIENT_SECRET`, `INSTAGRAM_REDIRECT_URI`
- `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, `FACEBOOK_REDIRECT_URI`
- `X_CLIENT_ID`, `X_CLIENT_SECRET`, `X_REDIRECT_URI`

## Observability

- `LOG_LEVEL`: Logger verbosity.
- `OTEL_EXPORTER_OTLP_ENDPOINT`: Optional tracing endpoint.
- `RELEASE_VERSION`: Build or release identifier.

