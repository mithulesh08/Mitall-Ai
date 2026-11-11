import 'tsx';

const { app, startServer } = await import('./server/serverApp');

if (!process.env.VERCEL) {
  await startServer();
}

export default app;
export { app };
