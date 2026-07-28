import { http, HttpResponse } from 'msw';

/**
 * Az incidens-wizard fotó-feltöltési útvonalának MSW-tükre (presigned URL +
 * mock-S3 PUT). A wizard a module-ehs része, ezért a handlerei is itt élnek —
 * a shell-aggregátor (src/mocks/handlers.ts) csomag-mocksként fogyasztja.
 */
export const wizardPhotoHandlers = [
  // POST /api/ehs/photos/presigned-url
  http.post('/api/ehs/photos/presigned-url', async () => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return HttpResponse.json({
      uploadUrl: 'https://mock-s3.amazonaws.com/upload',
      s3Key: `ehs/photos/${crypto.randomUUID()}.jpg`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });
  }),

  // PUT a mock-S3-ra
  http.put('https://mock-s3.amazonaws.com/upload', async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return new HttpResponse(null, { status: 200 });
  }),
];
