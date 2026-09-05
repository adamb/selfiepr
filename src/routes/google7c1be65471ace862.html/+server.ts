import type { RequestHandler } from "./$types.js";

/** Google Search Console HTML file verification (CF Pages pretty-URLs 308 .html assets). */
export const GET: RequestHandler = async () => {
	return new Response("google-site-verification: google7c1be65471ace862.html", {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "public, max-age=0, must-revalidate"
		}
	});
};
