# AI Marketing Agent

Goal:
Build an AI agent pipeline that takes product information and product images and automatically creates social media content and publishes it.

Inputs:
- Product name
- Product description
- Product features
- Target audience
- Product images

Tasks:
1. Analyze the product.
2. Extract key selling points.
3. Generate captions for:
   - Instagram
   - LinkedIn
   - Facebook
   - X
4. Generate marketing creatives from existing images.
5. Resize assets for each platform.
6. Publish posts via social APIs.
7. Store analytics.
8. Use analytics to improve future posts.

Tech stack:
- Backend: Express.js
- Database: PostgreSQL
- Agent framework: LangGraph
- Automation: n8n
- LLM: Gemini/OpenAI