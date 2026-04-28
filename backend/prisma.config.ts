import { defineConfig } from '@prisma/config';

export default defineConfig({
  earlyAccess: true,
  schema: {
    // We do not define the connection URL here for legacy reasons, 
    // actually Prisma v7 expects it as standard envvar or via client config.
  }
});
