import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

/**
 * Public endpoint – no Shopify session auth required.
 * Called by the Theme App Extension via App Proxy or direct fetch.
 *
 * Query params:
 *   - productId: the Shopify product GID, e.g. "gid://shopify/Product/1234567890"
 *   - shop:      the shop domain, e.g. "my-store.myshopify.com"
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  const shop = url.searchParams.get("shop");

  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60",
  };

  if (!productId || !shop) {
    return new Response(
      JSON.stringify({ error: "Missing productId or shop parameter." }),
      { status: 400, headers },
    );
  }

  const rule = await prisma.upsellRule.findFirst({
    where: {
      shop,
      triggerProductId: productId,
      status: "active",
    },
    select: {
      id: true,
      recommendedProductId: true,
      recommendedProductTitle: true,
    },
  });

  if (!rule) {
    return new Response(JSON.stringify({ recommendation: null }), {
      status: 200,
      headers,
    });
  }

  return new Response(
    JSON.stringify({
      recommendation: {
        id: rule.id,
        productId: rule.recommendedProductId,
        productTitle: rule.recommendedProductTitle,
      },
    }),
    { status: 200, headers },
  );
};
